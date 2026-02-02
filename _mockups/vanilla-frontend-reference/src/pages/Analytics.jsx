/**
 * Analytics Page
 * Dashboard for analytics and metrics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Activity, Zap, Database } from 'lucide-react';
import analyticsService from '../services/analyticsService.js';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [workflowAnalytics, setWorkflowAnalytics] = useState([]);
  const [engineAnalytics, setEngineAnalytics] = useState([]);
  const [tokenAnalytics, setTokenAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, workflowData, engineData, tokenData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getWorkflowAnalytics({ startDate: getStartDate() }),
        analyticsService.getEngineAnalytics({ startDate: getStartDate() }),
        analyticsService.getTokenAnalytics({ startDate: getStartDate() })
      ]);
      setStats(statsData);
      setWorkflowAnalytics(workflowData);
      setEngineAnalytics(engineData);
      setTokenAnalytics(tokenData);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return startDate.toISOString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Workflows</p>
                  <p className="text-2xl font-bold">{stats.workflows?.total_workflows || 0}</p>
                </div>
                <Database className="w-8 h-8 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Executions</p>
                  <p className="text-2xl font-bold">{stats.executions?.total_executions || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Engines</p>
                  <p className="text-2xl font-bold">{stats.engines?.active_engines || 0}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tokens Used</p>
                  <p className="text-2xl font-bold">{Math.round(stats.tokens?.totalUsed || 0).toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Workflow Analytics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
          <h2 className="text-lg font-semibold mb-4">Workflow Analytics</h2>
          {workflowAnalytics.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No workflow data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="text-left py-2">Workflow</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Completed</th>
                    <th className="text-right py-2">Failed</th>
                    <th className="text-right py-2">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowAnalytics.map((item) => {
                    const successRate = item.total_executions > 0
                      ? ((item.completed / item.total_executions) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={item.workflow_id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-2">{item.workflow_name}</td>
                        <td className="text-right py-2">{item.total_executions}</td>
                        <td className="text-right py-2 text-green-600">{item.completed}</td>
                        <td className="text-right py-2 text-red-600">{item.failed}</td>
                        <td className="text-right py-2">{successRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Engine Analytics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
          <h2 className="text-lg font-semibold mb-4">Engine Analytics</h2>
          {engineAnalytics.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No engine data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="text-left py-2">Engine</th>
                    <th className="text-right py-2">Executions</th>
                    <th className="text-right py-2">Avg Time (ms)</th>
                    <th className="text-right py-2">Tokens Used</th>
                    <th className="text-right py-2">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {engineAnalytics.map((item) => (
                    <tr key={item.engine_id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="py-2">{item.engine_name}</td>
                      <td className="text-right py-2">{item.total_executions}</td>
                      <td className="text-right py-2">{Math.round(item.avg_execution_time_ms || 0)}</td>
                      <td className="text-right py-2">{Math.round(item.total_tokens_used || 0).toLocaleString()}</td>
                      <td className="text-right py-2">${(item.total_cost || 0).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Token Usage */}
        {tokenAnalytics.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
            <h2 className="text-lg font-semibold mb-4">Top Token Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="text-left py-2">User</th>
                    <th className="text-right py-2">Tokens Used</th>
                    <th className="text-right py-2">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenAnalytics.slice(0, 10).map((item) => (
                    <tr key={item.user_id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="py-2">{item.email}</td>
                      <td className="text-right py-2">{Math.round(item.total_tokens_used || 0).toLocaleString()}</td>
                      <td className="text-right py-2">{item.transaction_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
