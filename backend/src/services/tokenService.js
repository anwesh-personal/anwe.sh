/**
 * Token Wallet Service
 * Manages user token wallets, policies, and ledger
 */

import pool from '../config/database.js';

class TokenService {
  /**
   * Get user wallet
   */
  async getWallet(userId) {
    const { rows } = await pool.query(
      `SELECT 
        utw.*,
        l.name as level_name,
        l.slug as level_slug
      FROM user_token_wallets utw
      LEFT JOIN levels l ON utw.level_id = l.id
      WHERE utw.user_id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.normalizeWallet(rows[0]);
  }

  /**
   * Ensure wallet exists for user
   */
  async ensureWallet(userId, levelId = null) {
    const existing = await this.getWallet(userId);
    if (existing) {
      return existing;
    }

    // Get user's tenant
    const { rows: userRows } = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userRows.length === 0) {
      throw new Error('User not found');
    }

    // Create wallet
    const { rows } = await pool.query(
      `INSERT INTO user_token_wallets (user_id, tenant_id, level_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, userRows[0].tenant_id, levelId]
    );

    // Auto-allocate tokens if level has policy
    if (levelId) {
      await pool.query('SELECT auto_allocate_tokens_for_level($1, $2)', [userId, levelId]);
    }

    return this.normalizeWallet(rows[0]);
  }

  /**
   * Adjust user tokens
   */
  async adjustTokens(userId, amount, direction, reason, options = {}) {
    const {
      source = 'system',
      referenceType = null,
      referenceId = null,
      executionId = null,
      metadata = {}
    } = options;

    const { rows } = await pool.query(
      `SELECT * FROM adjust_user_tokens(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )`,
      [
        userId,
        amount,
        direction,
        reason,
        source,
        referenceType,
        referenceId,
        executionId,
        JSON.stringify(metadata)
      ]
    );

    return rows[0];
  }

  /**
   * Get token policy for user
   */
  async getUserPolicy(userId) {
    // Get user's level
    const { rows: walletRows } = await pool.query(
      'SELECT level_id FROM user_token_wallets WHERE user_id = $1',
      [userId]
    );

    if (walletRows.length === 0 || !walletRows[0].level_id) {
      return null;
    }

    // Check for user-specific policy first
    const { rows: userPolicyRows } = await pool.query(
      'SELECT * FROM user_token_policies WHERE user_id = $1',
      [userId]
    );

    if (userPolicyRows.length > 0) {
      return this.normalizePolicy(userPolicyRows[0]);
    }

    // Fall back to level policy
    const { rows: levelPolicyRows } = await pool.query(
      'SELECT * FROM level_token_policies WHERE level_id = $1',
      [walletRows[0].level_id]
    );

    if (levelPolicyRows.length > 0) {
      return this.normalizePolicy(levelPolicyRows[0]);
    }

    return null;
  }

  /**
   * Get ledger entries for user
   */
  async getLedger(userId, limit = 50, offset = 0) {
    const { rows } = await pool.query(
      `SELECT * FROM user_token_ledger
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return rows.map(this.normalizeLedgerEntry);
  }

  /**
   * Normalize wallet data
   */
  normalizeWallet(wallet) {
    return {
      id: wallet.id,
      userId: wallet.user_id,
      tenantId: wallet.tenant_id,
      levelId: wallet.level_id,
      levelName: wallet.level_name,
      levelSlug: wallet.level_slug,
      currentTokens: Number(wallet.current_tokens),
      reservedTokens: Number(wallet.reserved_tokens),
      lifetimeTokens: Number(wallet.lifetime_tokens),
      monthlyAllocationTokens: Number(wallet.monthly_allocation_tokens),
      borrowedTokens: Number(wallet.borrowed_tokens),
      lastResetAt: wallet.last_reset_at,
      nextResetAt: wallet.next_reset_at,
      status: wallet.status,
      metadata: wallet.metadata || {},
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at
    };
  }

  /**
   * Normalize policy data
   */
  normalizePolicy(policy) {
    return {
      id: policy.id,
      levelId: policy.level_id,
      userId: policy.user_id,
      baseAllocation: policy.base_allocation,
      monthlyAllocation: policy.monthly_allocation,
      monthlyCap: policy.monthly_cap,
      rolloverPercent: Number(policy.rollover_percent),
      allocationMode: policy.allocation_mode,
      enforcementMode: policy.enforcement_mode,
      priorityWeight: policy.priority_weight,
      allowManualOverride: policy.allow_manual_override,
      notes: policy.notes,
      metadata: policy.metadata || {}
    };
  }

  /**
   * Normalize ledger entry
   */
  normalizeLedgerEntry(entry) {
    return {
      id: entry.id,
      walletId: entry.wallet_id,
      userId: entry.user_id,
      tenantId: entry.tenant_id,
      levelId: entry.level_id,
      direction: entry.direction,
      amount: Number(entry.amount),
      balanceAfter: Number(entry.balance_after),
      reservedAfter: Number(entry.reserved_after),
      lifetimeAfter: Number(entry.lifetime_after),
      reason: entry.reason,
      source: entry.source,
      referenceType: entry.reference_type,
      referenceId: entry.reference_id,
      executionId: entry.execution_id,
      metadata: entry.metadata || {},
      createdAt: entry.created_at
    };
  }
}

export default new TokenService();
