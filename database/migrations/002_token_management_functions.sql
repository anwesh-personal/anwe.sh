-- =====================================================
-- TOKEN MANAGEMENT FUNCTIONS
-- Functions for token wallet operations
-- =====================================================

-- Function: Adjust user tokens (credit, debit, reserve, release, adjustment)
CREATE OR REPLACE FUNCTION adjust_user_tokens(
  p_user_id uuid,
  p_amount bigint,
  p_direction text,
  p_reason text,
  p_source text DEFAULT 'system',
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_execution_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_wallet user_token_wallets%ROWTYPE;
  v_new_balance bigint;
  v_new_reserved bigint;
  v_new_lifetime bigint;
  v_abs_amount bigint;
  v_ledger_entry jsonb;
BEGIN
  -- Validate direction
  IF p_direction NOT IN ('credit', 'debit', 'reserve', 'release', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid direction: %. Must be credit, debit, reserve, release, or adjustment', p_direction;
  END IF;

  -- Get or create wallet
  SELECT * INTO v_wallet
  FROM user_token_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Create wallet if it doesn't exist
    INSERT INTO user_token_wallets (user_id, tenant_id)
    SELECT p_user_id, tenant_id FROM users WHERE id = p_user_id
    RETURNING * INTO v_wallet;
  END IF;

  v_abs_amount := ABS(p_amount);
  v_new_balance := v_wallet.current_tokens;
  v_new_reserved := v_wallet.reserved_tokens;
  v_new_lifetime := v_wallet.lifetime_tokens;

  -- Process based on direction
  IF p_direction = 'credit' THEN
    v_new_balance := v_new_balance + v_abs_amount;
  ELSIF p_direction = 'debit' THEN
    IF v_new_balance < v_abs_amount THEN
      RAISE EXCEPTION 'Insufficient tokens. Available: %, requested: %', v_new_balance, v_abs_amount;
    END IF;
    v_new_balance := v_new_balance - v_abs_amount;
    v_new_lifetime := v_new_lifetime + v_abs_amount;
  ELSIF p_direction = 'reserve' THEN
    IF v_new_balance < v_abs_amount THEN
      RAISE EXCEPTION 'Insufficient tokens to reserve. Available: %, requested: %', v_new_balance, v_abs_amount;
    END IF;
    v_new_balance := v_new_balance - v_abs_amount;
    v_new_reserved := v_new_reserved + v_abs_amount;
  ELSIF p_direction = 'release' THEN
    IF v_new_reserved < v_abs_amount THEN
      RAISE EXCEPTION 'Insufficient reserved tokens to release. Reserved: %, requested: %', v_new_reserved, v_abs_amount;
    END IF;
    v_new_balance := v_new_balance + v_abs_amount;
    v_new_reserved := v_new_reserved - v_abs_amount;
  ELSE -- adjustment
    v_new_balance := v_new_balance + p_amount;
  END IF;

  -- Validate non-negative
  IF v_new_balance < 0 OR v_new_reserved < 0 THEN
    RAISE EXCEPTION 'Token balances cannot be negative';
  END IF;

  -- Update wallet
  UPDATE user_token_wallets
  SET
    current_tokens = v_new_balance,
    reserved_tokens = v_new_reserved,
    lifetime_tokens = v_new_lifetime,
    updated_at = now()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  -- Create ledger entry
  INSERT INTO user_token_ledger (
    wallet_id,
    user_id,
    tenant_id,
    level_id,
    direction,
    amount,
    balance_after,
    reserved_after,
    lifetime_after,
    reason,
    source,
    reference_type,
    reference_id,
    execution_id,
    metadata
  )
  VALUES (
    v_wallet.id,
    v_wallet.user_id,
    v_wallet.tenant_id,
    v_wallet.level_id,
    p_direction,
    p_amount,
    v_new_balance,
    v_new_reserved,
    v_new_lifetime,
    p_reason,
    p_source,
    p_reference_type,
    p_reference_id,
    p_execution_id,
    p_metadata
  )
  RETURNING jsonb_build_object(
    'id', id,
    'wallet_id', wallet_id,
    'user_id', user_id,
    'direction', direction,
    'amount', amount,
    'balance_after', balance_after,
    'created_at', created_at
  ) INTO v_ledger_entry;

  RETURN v_ledger_entry;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-allocate tokens based on level policy
CREATE OR REPLACE FUNCTION auto_allocate_tokens_for_level(
  p_user_id uuid,
  p_level_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_policy level_token_policies%ROWTYPE;
  v_wallet user_token_wallets%ROWTYPE;
  v_allocation_amount bigint;
  v_result jsonb;
BEGIN
  -- Get level policy
  SELECT * INTO v_policy
  FROM level_token_policies
  WHERE level_id = p_level_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'No policy found for level');
  END IF;

  -- Get user wallet
  SELECT * INTO v_wallet
  FROM user_token_wallets
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Wallet not found');
  END IF;

  -- Determine allocation amount based on mode
  IF v_policy.allocation_mode = 'monthly' THEN
    v_allocation_amount := COALESCE(v_policy.monthly_allocation, v_policy.base_allocation, 0);
    
    -- Update monthly allocation tokens
    UPDATE user_token_wallets
    SET monthly_allocation_tokens = v_allocation_amount,
        next_reset_at = date_trunc('month', now()) + interval '1 month',
        last_reset_at = now()
    WHERE id = v_wallet.id;
  ELSE
    v_allocation_amount := v_policy.base_allocation;
    
    -- Credit tokens
    SELECT * INTO v_result FROM adjust_user_tokens(
      p_user_id,
      v_allocation_amount,
      'credit',
      'Auto-allocation from level policy',
      'system',
      NULL,
      NULL,
      NULL,
      jsonb_build_object('level_id', p_level_id, 'policy_id', v_policy.id)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'allocation_amount', v_allocation_amount,
    'allocation_mode', v_policy.allocation_mode
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Monthly token reset
CREATE OR REPLACE FUNCTION reset_monthly_tokens()
RETURNS integer AS $$
DECLARE
  v_wallet user_token_wallets%ROWTYPE;
  v_policy level_token_policies%ROWTYPE;
  v_reset_count integer := 0;
  v_rollover_amount bigint;
BEGIN
  -- Find wallets that need reset
  FOR v_wallet IN
    SELECT * FROM user_token_wallets
    WHERE next_reset_at IS NOT NULL
      AND next_reset_at <= now()
      AND status = 'active'
  LOOP
    -- Get level policy
    SELECT * INTO v_policy
    FROM level_token_policies
    WHERE level_id = v_wallet.level_id
      AND allocation_mode = 'monthly';

    IF FOUND THEN
      -- Calculate rollover
      IF v_policy.rollover_percent > 0 THEN
        v_rollover_amount := (v_wallet.monthly_allocation_tokens * v_policy.rollover_percent) / 100;
      ELSE
        v_rollover_amount := 0;
      END IF;

      -- Reset monthly allocation
      UPDATE user_token_wallets
      SET
        monthly_allocation_tokens = COALESCE(v_policy.monthly_allocation, v_policy.base_allocation, 0) + v_rollover_amount,
        last_reset_at = now(),
        next_reset_at = date_trunc('month', now()) + interval '1 month'
      WHERE id = v_wallet.id;

      v_reset_count := v_reset_count + 1;
    END IF;
  END LOOP;

  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql;
