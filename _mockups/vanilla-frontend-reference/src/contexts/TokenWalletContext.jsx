/**
 * Token Wallet Context
 * Manages user token wallet state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const TokenWalletContext = createContext();

export const useTokenWallet = () => {
  const context = useContext(TokenWalletContext);
  if (!context) {
    throw new Error('useTokenWallet must be used within TokenWalletProvider');
  }
  return context;
};

export const TokenWalletProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWallet();
    } else {
      setWallet(null);
      setPolicy(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tokens/wallet');
      setWallet(response.data.wallet);
      setPolicy(response.data.policy);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLedger = async (limit = 50, offset = 0) => {
    try {
      const response = await api.get('/tokens/ledger', {
        params: { limit, offset }
      });
      return response.data.entries;
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
      return [];
    }
  };

  // Calculate stats
  const stats = wallet ? {
    available: wallet.currentTokens,
    reserved: wallet.reservedTokens,
    lifetime: wallet.lifetimeTokens,
    monthly: wallet.monthlyAllocationTokens,
    used: wallet.lifetimeTokens - wallet.currentTokens,
    total: wallet.lifetimeTokens,
    remaining: wallet.currentTokens,
    usagePercent: wallet.lifetimeTokens > 0 
      ? ((wallet.lifetimeTokens - wallet.currentTokens) / wallet.lifetimeTokens) * 100 
      : 0
  } : null;

  const value = {
    wallet,
    policy,
    stats,
    loading,
    refresh: fetchWallet,
    getLedger
  };

  return (
    <TokenWalletContext.Provider value={value}>
      {children}
    </TokenWalletContext.Provider>
  );
};
