/**
 * Builder Routes
 * Template generation endpoints
 */

import express from 'express';
import { generateTemplate } from '../controllers/builderController.js';

const router = express.Router();

// Generate template from configuration
router.post('/generate', generateTemplate);

export default router;
