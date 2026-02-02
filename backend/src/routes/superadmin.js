/**
 * Super Admin Routes
 * Platform-wide administration endpoints
 */

import express from 'express';
import { requireSuperAdmin } from '../middleware/auth.js';
import { getStats, getUsers, getTenants, getProviders, getSettings, updateSettings } from '../controllers/superadminController.js';

const router = express.Router();

// All routes require super admin authentication
router.use(requireSuperAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/tenants', getTenants);
router.get('/providers', getProviders);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
