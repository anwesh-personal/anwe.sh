/**
 * Worker Routes
 */

import express from 'express';
import workerController from '../controllers/workerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register worker (no auth required for heartbeat/registration)
router.post('/register', workerController.registerWorker.bind(workerController));
router.post('/:workerId/heartbeat', workerController.updateHeartbeat.bind(workerController));

// All other routes require authentication
router.use(authenticate);

// Get workers
router.get('/', workerController.getWorkers.bind(workerController));

// Get worker by ID
router.get('/:workerId', workerController.getWorker.bind(workerController));

// Update worker health score
router.put('/:workerId/health', workerController.updateHealthScore.bind(workerController));

// Update worker load
router.put('/:workerId/load', workerController.updateLoad.bind(workerController));

// Set worker status
router.put('/:workerId/status', workerController.setStatus.bind(workerController));

// Log worker event
router.post('/events', workerController.logEvent.bind(workerController));

// Get worker events
router.get('/events', workerController.getEvents.bind(workerController));

// Get worker statistics
router.get('/stats/summary', workerController.getWorkerStats.bind(workerController));

// Get available workers for routing
router.get('/available', workerController.getAvailableWorkers.bind(workerController));

export default router;
