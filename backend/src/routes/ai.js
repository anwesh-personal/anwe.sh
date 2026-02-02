/**
 * AI Routes
 */

import express from 'express';
import { getProviders, getModels, execute, getExecutions, getExecution } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/providers', authenticate, getProviders);
router.get('/models', authenticate, getModels);
router.get('/models/:providerId', authenticate, getModels);
router.post('/execute', authenticate, execute);
router.get('/executions', authenticate, getExecutions);
router.get('/executions/:id', authenticate, getExecution);

export default router;
