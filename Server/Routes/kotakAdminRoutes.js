import express from 'express';
import ctrl from '../Controllers/kotakAdminController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Keep these protected behind your app auth.
// If you want stricter protection later, add role checks here too.
router.get('/session', authenticate, ctrl.getSessionStatus);
router.post('/login', authenticate, ctrl.loginWithTotp);
router.post('/auto-login', authenticate, ctrl.autoLogin);
router.post('/instrument-master/refresh', authenticate, ctrl.refreshInstrumentMaster);
router.get('/instrument-master/status', authenticate, ctrl.getInstrumentMasterStatus);
router.post('/logout', authenticate, ctrl.logoutKotak);

export default router;
