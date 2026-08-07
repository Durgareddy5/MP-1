import express from 'express';
import ctrl from '../Controllers/fundController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/',              ctrl.getFunds);
router.post('/deposit',      ctrl.deposit);
router.post('/withdraw',     ctrl.withdraw);
router.get('/transactions',  ctrl.getTransactions);

export default router;