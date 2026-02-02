/**
 * Engine Service
 * Frontend service for engine API calls
 */

import api from '../lib/api.js';

const engineService = {
  /**
   * Get available engines
   */
  async getAvailableEngines() {
    const { data } = await api.get('/engines/available');
    return data.engines;
  },

  /**
   * Get engines
   */
  async getEngines(options = {}) {
    const { data } = await api.get('/engines', { params: options });
    return data.engines;
  },

  /**
   * Get engine by ID
   */
  async getEngine(engineId) {
    const { data } = await api.get(`/engines/${engineId}`);
    return data.engine;
  },

  /**
   * Deploy engine
   */
  async deployEngine(engineData) {
    const { data } = await api.post('/engines', engineData);
    return data.engine;
  },

  /**
   * Update engine
   */
  async updateEngine(engineId, updates) {
    const { data } = await api.put(`/engines/${engineId}`, updates);
    return data.engine;
  },

  /**
   * Assign engine
   */
  async assignEngine(assignmentData) {
    const { data } = await api.post('/engines/assign', assignmentData);
    return data.assignment;
  },

  /**
   * Create user engine copy
   */
  async createUserEngine(engineId) {
    const { data } = await api.post(`/engines/${engineId}/copy`);
    return data.userEngine;
  },

  /**
   * Generate API key
   */
  async generateAPIKey(userEngineId) {
    const { data } = await api.post(`/engines/user/${userEngineId}/api-key`);
    return data.apiKey;
  },

  /**
   * Execute engine
   */
  async executeEngine(engineId, inputData = {}) {
    const { data } = await api.post(`/engines/${engineId}/execute`, { inputData });
    return data.execution;
  },

  /**
   * Get executions
   */
  async getExecutions(options = {}) {
    const { data } = await api.get('/engines/executions', { params: options });
    return data.executions;
  },

  /**
   * Get execution by ID
   */
  async getExecution(executionId) {
    const { data } = await api.get(`/engines/executions/${executionId}`);
    return data.execution;
  }
};

export default engineService;
