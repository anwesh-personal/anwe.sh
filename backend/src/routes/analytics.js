/**
 * Analytics Routes
 */

import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get system metrics
router.get('/metrics', analyticsController.getSystemMetrics.bind(analyticsController));

// Get aggregated metrics
router.get('/metrics/aggregated', analyticsController.getAggregatedMetrics.bind(analyticsController));

// Get workflow analytics
router.get('/workflows', analyticsController.getWorkflowAnalytics.bind(analyticsController));

// Get engine analytics
router.get('/engines', analyticsController.getEngineAnalytics.bind(analyticsController));

// Get token analytics
router.get('/tokens', analyticsController.getTokenAnalytics.bind(analyticsController));

// Get routing metrics
router.get('/routing', analyticsController.getRoutingMetrics.bind(analyticsController));

// Record metric
router.post('/metrics', analyticsController.recordMetric.bind(analyticsController));

// Get dashboard stats
router.get('/dashboard', analyticsController.getDashboardStats.bind(analyticsController));

export default router;
