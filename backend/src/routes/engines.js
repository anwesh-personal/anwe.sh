/**
 * Engine Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getEngines,
  deployEngine,
  assignEngine,
  createUserEngine,
  generateAPIKey,
  executeEngine
} from '../controllers/engineController.js';

const router = express.Router();

router.get('/', authenticate, getEngines);
router.post('/deploy', authenticate, deployEngine);
router.post('/assign', authenticate, assignEngine);
router.post('/user-engine', authenticate, createUserEngine);
router.post('/api-key', authenticate, generateAPIKey);
router.post('/execute', authenticate, executeEngine);

export default router;
