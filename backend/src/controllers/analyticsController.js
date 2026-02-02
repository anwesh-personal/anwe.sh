/**
 * Analytics Controller
 * Handles analytics and metrics API requests
 */

import analyticsService from '../services/analyticsService.js';

class AnalyticsController {
  /**
   * Get system metrics
   */
  async getSystemMetrics(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { metricType, startDate, endDate, limit } = req.query;

      const metrics = await analyticsService.getSystemMetrics(tenantId, {
        metricType,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : undefined
      });

      res.json({ metrics });
    } catch (error) {
      console.error('Error getting system metrics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { metricType, startDate, endDate, groupBy } = req.query;

      const metrics = await analyticsService.getAggregatedMetrics(tenantId, {
        metricType,
        startDate,
        endDate,
        groupBy
      });

      res.json({ metrics });
    } catch (error) {
      console.error('Error getting aggregated metrics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { startDate, endDate, workflowId } = req.query;

      const analytics = await analyticsService.getWorkflowAnalytics(tenantId, {
        startDate,
        endDate,
        workflowId
      });

      res.json({ analytics });
    } catch (error) {
      console.error('Error getting workflow analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get engine analytics
   */
  async getEngineAnalytics(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { startDate, endDate, engineId } = req.query;

      const analytics = await analyticsService.getEngineAnalytics(tenantId, {
        startDate,
        endDate,
        engineId
      });

      res.json({ analytics });
    } catch (error) {
      console.error('Error getting engine analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get token analytics
   */
  async getTokenAnalytics(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { startDate, endDate, userId } = req.query;

      const analytics = await analyticsService.getTokenAnalytics(tenantId, {
        startDate,
        endDate,
        userId
      });

      res.json({ analytics });
    } catch (error) {
      console.error('Error getting token analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get routing metrics
   */
  async getRoutingMetrics(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { workerId } = req.query;

      const metrics = await analyticsService.getRoutingMetrics(tenantId, workerId);

      res.json({ metrics });
    } catch (error) {
      console.error('Error getting routing metrics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Record metric
   */
  async recordMetric(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { metricType, metricData } = req.body;

      if (!metricType) {
        return res.status(400).json({ error: 'metricType is required' });
      }

      const metric = await analyticsService.recordMetric(tenantId, metricType, metricData || {});

      res.status(201).json({ metric });
    } catch (error) {
      console.error('Error recording metric:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(req, res) {
    try {
      const { tenantId } = req.tenant;
      const userId = req.user?.id || null;

      const stats = await analyticsService.getDashboardStats(tenantId, userId);

      res.json({ stats });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AnalyticsController();
