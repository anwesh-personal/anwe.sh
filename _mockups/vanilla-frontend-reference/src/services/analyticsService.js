/**
 * Analytics Service
 * Frontend service for analytics API calls
 */

import api from '../lib/api.js';

const analyticsService = {
  /**
   * Get system metrics
   */
  async getSystemMetrics(options = {}) {
    const { data } = await api.get('/analytics/metrics', { params: options });
    return data.metrics;
  },

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(options = {}) {
    const { data } = await api.get('/analytics/metrics/aggregated', { params: options });
    return data.metrics;
  },

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(options = {}) {
    const { data } = await api.get('/analytics/workflows', { params: options });
    return data.analytics;
  },

  /**
   * Get engine analytics
   */
  async getEngineAnalytics(options = {}) {
    const { data } = await api.get('/analytics/engines', { params: options });
    return data.analytics;
  },

  /**
   * Get token analytics
   */
  async getTokenAnalytics(options = {}) {
    const { data } = await api.get('/analytics/tokens', { params: options });
    return data.analytics;
  },

  /**
   * Get routing metrics
   */
  async getRoutingMetrics(workerId = null) {
    const { data } = await api.get('/analytics/routing', { params: { workerId } });
    return data.metrics;
  },

  /**
   * Record metric
   */
  async recordMetric(metricType, metricData = {}) {
    const { data } = await api.post('/analytics/metrics', { metricType, metricData });
    return data.metric;
  },

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    const { data } = await api.get('/analytics/dashboard');
    return data.stats;
  }
};

export default analyticsService;
