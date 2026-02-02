/**
 * AI Service
 * Handles AI-related API calls
 */

import api from '../lib/api.js';

export const aiService = {
  async getProviders() {
    const response = await api.get('/ai/providers');
    return response.data.providers;
  },

  async getModels(providerId = null) {
    const url = providerId ? `/ai/models/${providerId}` : '/ai/models';
    const response = await api.get(url);
    return response.data.models;
  },

  async execute(modelId, prompt, options = {}) {
    const response = await api.post('/ai/execute', {
      modelId,
      prompt,
      ...options
    });
    return response.data;
  },

  async getExecutions(limit = 50, offset = 0) {
    const response = await api.get('/ai/executions', {
      params: { limit, offset }
    });
    return response.data.executions;
  },

  async getExecution(id) {
    const response = await api.get(`/ai/executions/${id}`);
    return response.data.execution;
  }
};

export default aiService;
