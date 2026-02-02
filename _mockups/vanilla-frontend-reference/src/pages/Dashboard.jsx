/**
 * Dashboard Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTokenWallet } from '../contexts/TokenWalletContext.jsx';
import { LogOut, User, Zap, Brain, Workflow, Cpu, BarChart3, Server, Palette, Wrench } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { wallet, stats, loading: walletLoading } = useTokenWallet();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="shadow" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2"
              style={{ color: 'var(--color-foreground-secondary)' }}
            >
              <User className="w-5 h-5" />
              <span>{user?.fullName || user?.email}</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center space-x-2"
              style={{ color: 'var(--color-foreground-secondary)' }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Wallet Card */}
        {walletLoading ? (
          <div className="text-center py-8" style={{ color: 'var(--color-foreground-secondary)' }}>Loading wallet...</div>
        ) : (
          <div className="rounded-lg shadow p-6 mb-8" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Token Wallet
            </h2>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Available</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.available.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Used</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.used.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Usage</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.usagePercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/ai"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <Brain className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Studio</h3>
                <p className="text-gray-600">Execute AI models and workflows</p>
              </div>
            </div>
          </Link>

          <Link
            to="/workflows"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Workflow className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Workflow Builder</h3>
                <p className="text-gray-600">Create and manage workflows</p>
              </div>
            </div>
          </Link>

          <Link
            to="/engines"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Cpu className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Engine Management</h3>
                <p className="text-gray-600">Manage AI engines</p>
              </div>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 rounded-lg p-3">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analytics</h3>
                <p className="text-gray-600">View metrics and insights</p>
              </div>
            </div>
          </Link>

          <Link
            to="/workers"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <Server className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Worker Monitoring</h3>
                <p className="text-gray-600">Monitor worker health and status</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <User className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Profile</h3>
                <p className="text-gray-600">Manage your account settings</p>
              </div>
            </div>
          </Link>

          <Link
            to="/brand-kits"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-pink-100 rounded-lg p-3">
                <Palette className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Brand Kits</h3>
                <p className="text-gray-600">Preview all brand kit designs</p>
              </div>
            </div>
          </Link>

          <Link
            to="/builder"
            className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg p-3">
                <Wrench className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">SaaS Builder</h3>
                <p className="text-gray-600">Configure and generate your SaaS</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
