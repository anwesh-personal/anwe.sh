/**
 * Token Wallet Routes
 */

import express from 'express';
import { getWallet, getLedger, adjustTokens } from '../controllers/tokenController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/wallet', authenticate, getWallet);
router.get('/ledger', authenticate, getLedger);
router.post('/adjust', authenticate, adjustTokens);

export default router;
