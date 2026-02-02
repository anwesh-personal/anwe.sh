/**
 * Engine Controller
 */

import engineService from '../services/engineService.js';

export const getEngines = async (req, res) => {
  try {
    const engines = await engineService.getAvailableEngines(
      req.user.id,
      req.tenantId
    );
    res.json({ engines });
  } catch (error) {
    console.error('Get engines error:', error);
    res.status(500).json({ error: 'Failed to get engines' });
  }
};

export const deployEngine = async (req, res) => {
  try {
    // Only admins can deploy engines
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const engine = await engineService.deployEngine(
      req.tenantId,
      req.user.id,
      req.body
    );
    res.status(201).json({ engine });
  } catch (error) {
    console.error('Deploy engine error:', error);
    res.status(500).json({ error: 'Failed to deploy engine' });
  }
};

export const assignEngine = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const assignment = await engineService.assignEngine(req.tenantId, req.body);
    res.status(201).json({ assignment });
  } catch (error) {
    console.error('Assign engine error:', error);
    res.status(500).json({ error: 'Failed to assign engine' });
  }
};

export const createUserEngine = async (req, res) => {
  try {
    const { engineId } = req.body;
    const userEngine = await engineService.createUserEngine(
      req.user.id,
      req.tenantId,
      engineId
    );
    res.status(201).json({ userEngine });
  } catch (error) {
    console.error('Create user engine error:', error);
    res.status(500).json({ error: error.message || 'Failed to create user engine' });
  }
};

export const generateAPIKey = async (req, res) => {
  try {
    const { userEngineId } = req.body;
    const apiKey = await engineService.generateAPIKey(userEngineId, req.user.id);
    res.json({ apiKey }); // Only return once - store securely!
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
};

export const executeEngine = async (req, res) => {
  try {
    const { engineId, inputData } = req.body;
    const result = await engineService.executeEngine(
      req.user.id,
      req.tenantId,
      engineId,
      inputData
    );
    res.status(201).json(result);
  } catch (error) {
    console.error('Execute engine error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute engine' });
  }
};
