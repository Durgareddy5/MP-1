import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import orderRoutes from './orderRoutes.js';
import portfolioRoutes from './portfolioRoutes.js';
import watchlistRoutes from './watchlistRoutes.js';
import fundRoutes from './fundRoutes.js';
import marketRoutes from './marketRoutes.js';
import tradeRoutes from './tradeRoutes.js';
import alertRoutes from './alertRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import marketCtrl from '../Controllers/marketController.js';

// Mount all routes
router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/funds', fundRoutes);
router.use('/market', marketRoutes);
router.use('/stocks', marketRoutes);
// Compatibility: allow stock search at /stocks/search as well.
router.get('/stocks/search', marketCtrl.searchStocks);
router.use('/trades', tradeRoutes);
router.use('/alerts', alertRoutes);
router.use('/settings', settingsRoutes);


export default router;
