import express from 'express';
import ctrl from '../Controllers/orderController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';
import { validatePlaceOrder, validateModifyOrder } from '../Middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticate); // All order routes require auth

router.post('/',              validatePlaceOrder,  ctrl.placeOrder);
router.get('/',                                    ctrl.getOrders);
router.get('/:id',                                 ctrl.getOrderById);
router.put('/:id',            validateModifyOrder, ctrl.modifyOrder);
router.put('/:id/cancel',                          ctrl.cancelOrder);

export default router;