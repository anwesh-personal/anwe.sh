/**
 * Level Service
 * Manages level features, pricing, restrictions, and analytics
 */

import pool from '../config/database.js';

class LevelService {
  /**
   * Get level with all details
   */
  async getLevel(levelId, tenantId) {
    const { rows } = await pool.query(
      'SELECT * FROM levels WHERE id = $1 AND tenant_id = $2',
      [levelId, tenantId]
    );

    if (rows.length === 0) {
      return null;
    }

    const level = rows[0];

    // Get features
    const { rows: features } = await pool.query(
      'SELECT * FROM level_features WHERE level_id = $1',
      [levelId]
    );

    // Get pricing
    const { rows: pricing } = await pool.query(
      'SELECT * FROM level_pricing WHERE level_id = $1',
      [levelId]
    );

    // Get restrictions
    const { rows: restrictions } = await pool.query(
      'SELECT * FROM level_restrictions WHERE level_id = $1',
      [levelId]
    );

    // Get benefits
    const { rows: benefits } = await pool.query(
      'SELECT * FROM level_benefits WHERE level_id = $1 ORDER BY benefit_order',
      [levelId]
    );

    return {
      ...level,
      features,
      pricing,
      restrictions,
      benefits
    };
  }

  /**
   * Check if user has feature access
   */
  async hasFeatureAccess(userId, tenantId, featureName) {
    // Get user's level
    const { rows: walletRows } = await pool.query(
      `SELECT level_id FROM user_token_wallets WHERE user_id = $1`,
      [userId]
    );

    if (walletRows.length === 0 || !walletRows[0].level_id) {
      return false;
    }

    const levelId = walletRows[0].level_id;

    // Check feature
    const { rows } = await pool.query(
      `SELECT * FROM level_features
       WHERE level_id = $1 AND feature_name = $2 AND is_enabled = true`,
      [levelId, featureName]
    );

    return rows.length > 0;
  }

  /**
   * Check feature usage limit
   */
  async checkFeatureUsage(userId, tenantId, featureName) {
    const { rows: walletRows } = await pool.query(
      `SELECT level_id FROM user_token_wallets WHERE user_id = $1`,
      [userId]
    );

    if (walletRows.length === 0 || !walletRows[0].level_id) {
      return { allowed: false, reason: 'No level assigned' };
    }

    const levelId = walletRows[0].level_id;

    // Get feature config
    const { rows: featureRows } = await pool.query(
      `SELECT * FROM level_features
       WHERE level_id = $1 AND feature_name = $2 AND is_enabled = true`,
      [levelId, featureName]
    );

    if (featureRows.length === 0) {
      return { allowed: false, reason: 'Feature not enabled' };
    }

    const feature = featureRows[0];

    // If no limit, allow
    if (!feature.usage_limit) {
      return { allowed: true };
    }

    // Check usage for period
    const periodStart = this.getPeriodStart(feature.usage_period);
    const { rows: usageRows } = await pool.query(
      `SELECT SUM(usage_count) as total_usage
       FROM level_feature_usage
       WHERE level_id = $1 AND user_id = $2 AND feature_name = $3
         AND usage_date >= $4`,
      [levelId, userId, featureName, periodStart]
    );

    const totalUsage = parseInt(usageRows[0]?.total_usage || 0);

    if (totalUsage >= feature.usage_limit) {
      return {
        allowed: false,
        reason: 'Usage limit reached',
        used: totalUsage,
        limit: feature.usage_limit
      };
    }

    return {
      allowed: true,
      used: totalUsage,
      limit: feature.usage_limit,
      remaining: feature.usage_limit - totalUsage
    };
  }

  /**
   * Record feature usage
   */
  async recordFeatureUsage(userId, tenantId, featureName, count = 1) {
    const { rows: walletRows } = await pool.query(
      `SELECT level_id FROM user_token_wallets WHERE user_id = $1`,
      [userId]
    );

    if (walletRows.length === 0 || !walletRows[0].level_id) {
      return;
    }

    const levelId = walletRows[0].level_id;
    const today = new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO level_feature_usage (
        tenant_id, level_id, user_id, feature_name, usage_count, usage_date
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (level_id, user_id, feature_name, usage_date) DO UPDATE
      SET usage_count = level_feature_usage.usage_count + $5`,
      [tenantId, levelId, userId, featureName, count, today]
    );
  }

  /**
   * Get upgrade paths
   */
  async getUpgradePaths(fromLevelId, tenantId) {
    const { rows } = await pool.query(
      `SELECT 
        up.*,
        to_level.name as to_level_name,
        to_level.slug as to_level_slug
      FROM level_upgrade_paths up
      INNER JOIN levels to_level ON up.to_level_id = to_level.id
      WHERE up.from_level_id = $1 
        AND up.tenant_id = $2
        AND up.is_active = true
      ORDER BY to_level.priority`,
      [fromLevelId, tenantId]
    );

    return rows;
  }

  /**
   * Get period start date
   */
  getPeriodStart(period) {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const day = now.getDay();
        return new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(0); // Lifetime
    }
  }
}

export default new LevelService();
