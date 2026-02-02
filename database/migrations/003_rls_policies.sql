-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Multi-tenant isolation policies
-- =====================================================

-- Note: These policies assume you're using a function to get current tenant_id
-- You'll need to adapt based on your authentication system

-- Helper function to get current tenant_id (adapt to your auth system)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
  -- This should be set by your application context
  -- For Supabase, you might use: current_setting('app.tenant_id', true)::uuid
  -- For custom auth, you might use: current_setting('request.jwt.claims', true)::json->>'tenant_id'
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get current user_id
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- TENANTS POLICIES
-- =====================================================
CREATE POLICY tenants_isolation ON tenants
  FOR ALL
  USING (id = get_current_tenant_id() OR get_current_user_id() IN (
    SELECT id FROM users WHERE role = 'superadmin'
  ));

-- =====================================================
-- USERS POLICIES
-- =====================================================
CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() OR
    id = get_current_user_id() OR
    get_current_user_id() IN (SELECT id FROM users WHERE role = 'superadmin')
  );

-- =====================================================
-- LEVELS POLICIES
-- =====================================================
CREATE POLICY levels_tenant_isolation ON levels
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- USER TOKEN WALLETS POLICIES
-- =====================================================
CREATE POLICY wallets_user_access ON user_token_wallets
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY wallets_user_update ON user_token_wallets
  FOR UPDATE
  USING (
    user_id = get_current_user_id() OR
    get_current_user_id() IN (SELECT id FROM users WHERE role IN ('admin', 'superadmin'))
  );

-- =====================================================
-- TOKEN POLICIES
-- =====================================================
CREATE POLICY level_policies_tenant_isolation ON level_token_policies
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY user_policies_user_access ON user_token_policies
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- TOKEN LEDGER POLICIES
-- =====================================================
CREATE POLICY ledger_user_access ON user_token_ledger
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- AI PROVIDERS POLICIES
-- =====================================================
CREATE POLICY ai_providers_tenant_isolation ON ai_providers
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() OR
    tenant_id IS NULL -- Global providers
  );

-- =====================================================
-- AI MODELS POLICIES
-- =====================================================
CREATE POLICY ai_models_tenant_isolation ON ai_models
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() OR
    tenant_id IS NULL -- Global models
  );

-- =====================================================
-- AI EXECUTIONS POLICIES
-- =====================================================
CREATE POLICY executions_user_access ON ai_executions
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY executions_user_create ON ai_executions
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- API KEYS POLICIES
-- =====================================================
CREATE POLICY api_keys_user_access ON api_keys
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY api_keys_user_manage ON api_keys
  FOR ALL
  USING (user_id = get_current_user_id());

-- =====================================================
-- SYSTEM CONFIGURATIONS POLICIES
-- =====================================================
CREATE POLICY configs_tenant_isolation ON system_configurations
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() OR
    (tenant_id IS NULL AND is_public = true) OR
    get_current_user_id() IN (SELECT id FROM users WHERE role = 'superadmin')
  );

CREATE POLICY configs_admin_manage ON system_configurations
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================
CREATE POLICY audit_logs_tenant_access ON audit_logs
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    ) OR
    get_current_user_id() IN (SELECT id FROM users WHERE role = 'superadmin')
  );

-- Super admins can insert audit logs
CREATE POLICY audit_logs_admin_insert ON audit_logs
  FOR INSERT
  WITH CHECK (
    get_current_user_id() IN (SELECT id FROM users WHERE role IN ('admin', 'superadmin'))
  );
