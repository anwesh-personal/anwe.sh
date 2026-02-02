/**
 * Workflow Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  executeWorkflow,
  getExecutions,
  getTemplates
} from '../controllers/workflowController.js';

const router = express.Router();

router.get('/', authenticate, getWorkflows);
router.post('/', authenticate, createWorkflow);
router.put('/:id', authenticate, updateWorkflow);
router.post('/execute', authenticate, executeWorkflow);
router.get('/executions', authenticate, getExecutions);
router.get('/templates', authenticate, getTemplates);

export default router;
