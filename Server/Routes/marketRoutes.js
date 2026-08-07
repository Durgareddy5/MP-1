import express from 'express';
import ctrl from '../Controllers/marketController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Public market status
router.get('/status', ctrl.getMarketStatus);

// Instrument master admin-ish helpers
router.get('/instrument-master/status', authenticate, ctrl.getInstrumentMasterStats);
router.post('/instrument-master/refresh', authenticate, ctrl.refreshInstrumentMaster);

// Snapshot market data
router.get('/indices',  ctrl.getAllIndices);    //checkout later authenticate is removed for all four
router.get('/top-gainers',  ctrl.getTopGainers);
router.get('/top-losers',  ctrl.getTopLosers);
router.get('/most-active',  ctrl.getMostActive);

// Search and stock detail
router.get('/search', ctrl.searchStocks);
router.get('/:symbol/quote', authenticate, ctrl.getStockQuote);
router.get('/:symbol/history', ctrl.getStockHistory);
router.get('/:symbol', authenticate, ctrl.getStockDetails);

export default router;
