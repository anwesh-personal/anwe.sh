/**
 * Workflow Controller
 */

import workflowService from '../services/workflowService.js';

export const getWorkflows = async (req, res) => {
  try {
    const { includePublic, limit, offset } = req.query;
    const workflows = await workflowService.getWorkflows(
      req.user.id,
      req.tenantId,
      {
        includePublic: includePublic === 'true',
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      }
    );
    res.json({ workflows });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: 'Failed to get workflows' });
  }
};

export const createWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.createWorkflow(
      req.user.id,
      req.tenantId,
      req.body
    );
    res.status(201).json({ workflow });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await workflowService.updateWorkflow(id, req.user.id, req.body);
    res.json({ workflow });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: error.message || 'Failed to update workflow' });
  }
};

export const executeWorkflow = async (req, res) => {
  try {
    const { workflowId, inputData } = req.body;
    const execution = await workflowService.createExecution(
      req.user.id,
      req.tenantId,
      workflowId,
      inputData
    );
    res.status(201).json({ execution });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
};

export const getExecutions = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const executions = await workflowService.getExecutions(
      req.user.id,
      req.tenantId,
      parseInt(limit) || 50,
      parseInt(offset) || 0
    );
    res.json({ executions });
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ error: 'Failed to get executions' });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    const templates = await workflowService.getTemplates(req.tenantId, category);
    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
};
