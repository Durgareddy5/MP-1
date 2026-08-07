import express from 'express';
import ctrl from '../Controllers/portfolioController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.getTradeLogs);

export default router;