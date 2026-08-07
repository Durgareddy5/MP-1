import express from 'express';
const router = express.Router();

import authCtrl from '../Controllers/authController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validatePasswordChange,
} from '../Middlewares/validationMiddleware.js';

// Routes
router.post('/register', validateRegister, authCtrl.register);
router.post('/login', validateLogin, authCtrl.login);
router.post('/logout', authenticate, authCtrl.logout);
router.post('/refresh-token', authCtrl.refreshToken);

router.get('/profile', authenticate, authCtrl.getProfile);
router.put('/profile', authenticate, authCtrl.updateProfile);

router.put(
  '/change-password',
  authenticate,
  validatePasswordChange,
  authCtrl.changePassword
);

router.get('/me', authenticate, authCtrl.getProfile);

export default router;