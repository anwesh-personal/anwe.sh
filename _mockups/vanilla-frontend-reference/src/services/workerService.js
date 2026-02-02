/**
 * Worker Service
 * Frontend service for worker management API calls
 */

import api from '../lib/api.js';

const workerService = {
  /**
   * Register worker
   */
  async registerWorker(workerData) {
    const { data } = await api.post('/workers/register', workerData);
    return data.worker;
  },

  /**
   * Update heartbeat
   */
  async updateHeartbeat(workerId) {
    const { data } = await api.post(`/workers/${workerId}/heartbeat`);
    return data;
  },

  /**
   * Get workers
   */
  async getWorkers(options = {}) {
    const { data } = await api.get('/workers', { params: options });
    return data.workers;
  },

  /**
   * Get worker by ID
   */
  async getWorker(workerId) {
    const { data } = await api.get(`/workers/${workerId}`);
    return data.worker;
  },

  /**
   * Update health score
   */
  async updateHealthScore(workerId, healthScore) {
    const { data } = await api.put(`/workers/${workerId}/health`, { healthScore });
    return data.worker;
  },

  /**
   * Update load
   */
  async updateLoad(workerId, currentLoad) {
    const { data } = await api.put(`/workers/${workerId}/load`, { currentLoad });
    return data.worker;
  },

  /**
   * Set status
   */
  async setStatus(workerId, status) {
    const { data } = await api.put(`/workers/${workerId}/status`, { status });
    return data.worker;
  },

  /**
   * Log event
   */
  async logEvent(workerId, eventType, eventData = {}, severity = 'info') {
    const { data } = await api.post('/workers/events', {
      workerId,
      eventType,
      eventData,
      severity
    });
    return data.event;
  },

  /**
   * Get events
   */
  async getEvents(options = {}) {
    const { data } = await api.get('/workers/events', { params: options });
    return data.events;
  },

  /**
   * Get worker stats
   */
  async getWorkerStats() {
    const { data } = await api.get('/workers/stats/summary');
    return data.stats;
  },

  /**
   * Get available workers
   */
  async getAvailableWorkers(options = {}) {
    const { data } = await api.get('/workers/available', { params: options });
    return data.workers;
  }
};

export default workerService;
