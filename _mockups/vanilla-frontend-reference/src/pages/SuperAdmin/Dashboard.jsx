/**
 * Super Admin Dashboard
 * Main overview page for platform administration
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Zap, Brain, Settings, TrendingUp, Activity, DollarSign } from 'lucide-react';
import api from '../../lib/api.js';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const SuperAdminDashboard = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTenants: 0,
    totalExecutions: 0,
    totalTokensUsed: 0,
    activeUsers: 0,
    revenue: 0,
    growthRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // TODO: Implement backend endpoints
      // const response = await api.get('/superadmin/stats');
      // setStats(response.data);
      
      // Mock data for now
      setStats({
        totalUsers: 1250,
        totalTenants: 45,
        totalExecutions: 12500,
        totalTokensUsed: 2500000,
        activeUsers: 850,
        revenue: 125000,
        growthRate: 12.5
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
            Super Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
            Platform-wide administration and monitoring
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Total Users
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Total Tenants
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                  {stats.totalTenants}
                </p>
              </div>
              <Building2 className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-foreground-secondary)' }}>
                  AI Executions
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                  {stats.totalExecutions.toLocaleString()}
                </p>
              </div>
              <Brain className="w-8 h-8" style={{ color: 'var(--color-secondary)' }} />
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Tokens Used
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                  {stats.totalTokensUsed.toLocaleString()}
                </p>
              </div>
              <Zap className="w-8 h-8" style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                Active Users
              </p>
              <Activity className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {stats.activeUsers.toLocaleString()}
            </p>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                Revenue
              </p>
              <DollarSign className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              ${stats.revenue.toLocaleString()}
            </p>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                Growth Rate
              </p>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {stats.growthRate}%
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/superadmin/users"
            className="rounded-lg p-6 transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Users className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>
                  User Management
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Manage users, roles, and permissions
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/superadmin/tenants"
            className="rounded-lg p-6 transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                <Building2 className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>
                  Tenant Management
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Manage tenants and subscriptions
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/superadmin/ai-providers"
            className="rounded-lg p-6 transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                <Brain className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>
                  AI Providers
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Configure AI providers and models
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/superadmin/settings"
            className="rounded-lg p-6 transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-warning)' }}
              >
                <Settings className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>
                  System Settings
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Platform configuration
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
