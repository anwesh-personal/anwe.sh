/**
 * Worker Controller
 * Handles worker management and monitoring API requests
 */

import workerService from '../services/workerService.js';

class WorkerController {
  /**
   * Register or update worker
   */
  async registerWorker(req, res) {
    try {
      const { tenantId } = req.tenant;
      const workerData = req.body;

      const worker = await workerService.registerWorker(tenantId, workerData);

      res.status(201).json({ worker });
    } catch (error) {
      console.error('Error registering worker:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update worker heartbeat
   */
  async updateHeartbeat(req, res) {
    try {
      const { workerId } = req.params;

      await workerService.updateHeartbeat(workerId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating heartbeat:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update worker health score
   */
  async updateHealthScore(req, res) {
    try {
      const { workerId } = req.params;
      const { healthScore } = req.body;

      if (healthScore === undefined || healthScore < 0 || healthScore > 100) {
        return res.status(400).json({ error: 'healthScore must be between 0 and 100' });
      }

      const worker = await workerService.updateHealthScore(workerId, healthScore);

      res.json({ worker });
    } catch (error) {
      console.error('Error updating health score:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update worker load
   */
  async updateLoad(req, res) {
    try {
      const { workerId } = req.params;
      const { currentLoad } = req.body;

      if (currentLoad === undefined || currentLoad < 0) {
        return res.status(400).json({ error: 'currentLoad must be >= 0' });
      }

      const worker = await workerService.updateLoad(workerId, currentLoad);

      res.json({ worker });
    } catch (error) {
      console.error('Error updating load:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get workers
   */
  async getWorkers(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { status, workerType, region, minHealthScore } = req.query;

      const workers = await workerService.getWorkers(tenantId, {
        status,
        workerType,
        region,
        minHealthScore: minHealthScore ? parseInt(minHealthScore) : null
      });

      res.json({ workers });
    } catch (error) {
      console.error('Error getting workers:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get worker by ID
   */
  async getWorker(req, res) {
    try {
      const { workerId } = req.params;

      const worker = await workerService.getWorker(workerId);

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      res.json({ worker });
    } catch (error) {
      console.error('Error getting worker:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Log worker event
   */
  async logEvent(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { workerId, eventType, eventData, severity } = req.body;

      if (!workerId || !eventType) {
        return res.status(400).json({ error: 'workerId and eventType are required' });
      }

      const event = await workerService.logEvent(tenantId, workerId, eventType, eventData, severity || 'info');

      res.status(201).json({ event });
    } catch (error) {
      console.error('Error logging event:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get worker events
   */
  async getEvents(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { workerId, eventType, severity, startDate, endDate, limit } = req.query;

      const events = await workerService.getEvents(tenantId, {
        workerId,
        eventType,
        severity,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : undefined
      });

      res.json({ events });
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get worker statistics
   */
  async getWorkerStats(req, res) {
    try {
      const { tenantId } = req.tenant;

      const stats = await workerService.getWorkerStats(tenantId);

      res.json({ stats });
    } catch (error) {
      console.error('Error getting worker stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Set worker status
   */
  async setStatus(req, res) {
    try {
      const { workerId } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'inactive', 'maintenance', 'error'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
      }

      const worker = await workerService.setStatus(workerId, status);

      res.json({ worker });
    } catch (error) {
      console.error('Error setting status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get available workers for routing
   */
  async getAvailableWorkers(req, res) {
    try {
      const { tenantId } = req.tenant;
      const { workerType, minHealthScore, maxLoadPercent } = req.query;

      const workers = await workerService.getAvailableWorkers(tenantId, {
        workerType,
        minHealthScore: minHealthScore ? parseInt(minHealthScore) : undefined,
        maxLoadPercent: maxLoadPercent ? parseInt(maxLoadPercent) : undefined
      });

      res.json({ workers });
    } catch (error) {
      console.error('Error getting available workers:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new WorkerController();
