/**
 * Token Wallet Controller
 * Handles token wallet operations
 */

import tokenService from '../services/tokenService.js';

export const getWallet = async (req, res) => {
  try {
    const wallet = await tokenService.getWallet(req.user.id);
    
    if (!wallet) {
      // Auto-create wallet if it doesn't exist
      const newWallet = await tokenService.ensureWallet(req.user.id);
      return res.json({ wallet: newWallet });
    }

    // Get policy
    const policy = await tokenService.getUserPolicy(req.user.id);

    res.json({
      wallet,
      policy
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
};

export const getLedger = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const entries = await tokenService.getLedger(req.user.id, limit, offset);

    res.json({ entries });
  } catch (error) {
    console.error('Get ledger error:', error);
    res.status(500).json({ error: 'Failed to get ledger' });
  }
};

export const adjustTokens = async (req, res) => {
  try {
    const { amount, direction, reason, source, referenceType, referenceId, metadata } = req.body;

    if (!amount || !direction || !reason) {
      return res.status(400).json({ error: 'Amount, direction, and reason are required' });
    }

    // Only allow admins to manually adjust tokens
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await tokenService.adjustTokens(
      req.body.userId || req.user.id,
      amount,
      direction,
      reason,
      {
        source: source || 'manual',
        referenceType,
        referenceId,
        metadata
      }
    );

    res.json({ success: true, ledgerEntry: result });
  } catch (error) {
    console.error('Adjust tokens error:', error);
    res.status(500).json({ error: error.message || 'Failed to adjust tokens' });
  }
};
