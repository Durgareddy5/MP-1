import express from 'express';
import ctrl from '../Controllers/portfolioController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/holdings',  ctrl.getHoldings);
router.get('/positions', ctrl.getPositions);
router.post('/positions/squareoff-all', ctrl.squareOffAllPositions);
router.post('/positions/:id/squareoff', ctrl.squareOffPosition);
router.get('/summary',   ctrl.getPortfolioSummary);
router.get('/analytics', ctrl.getAnalytics);
router.get('/trend', ctrl.getPortfolioTrend);

export default router;