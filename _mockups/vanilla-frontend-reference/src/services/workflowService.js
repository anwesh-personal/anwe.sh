/**
 * Workflow Service
 * Frontend service for workflow API calls
 */

import api from '../lib/api.js';

const workflowService = {
  /**
   * Get workflows
   */
  async getWorkflows(options = {}) {
    const { data } = await api.get('/workflows', { params: options });
    return data.workflows;
  },

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId) {
    const { data } = await api.get(`/workflows/${workflowId}`);
    return data.workflow;
  },

  /**
   * Create workflow
   */
  async createWorkflow(workflowData) {
    const { data } = await api.post('/workflows', workflowData);
    return data.workflow;
  },

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId, updates) {
    const { data } = await api.put(`/workflows/${workflowId}`, updates);
    return data.workflow;
  },

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId) {
    await api.delete(`/workflows/${workflowId}`);
  },

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, inputData = {}) {
    const { data } = await api.post(`/workflows/${workflowId}/execute`, { inputData });
    return data.execution;
  },

  /**
   * Get executions
   */
  async getExecutions(options = {}) {
    const { data } = await api.get('/workflows/executions', { params: options });
    return data.executions;
  },

  /**
   * Get execution by ID
   */
  async getExecution(executionId) {
    const { data } = await api.get(`/workflows/executions/${executionId}`);
    return data.execution;
  },

  /**
   * Get templates
   */
  async getTemplates(category = null) {
    const { data } = await api.get('/workflows/templates', { params: { category } });
    return data.templates;
  }
};

export default workflowService;
