import express from 'express';
import { authenticate } from '../Middlewares/authMiddleware.js';
import { PriceAlert } from '../Models/sql/index.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = express.Router();

router.use(authenticate);

// GET /alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await PriceAlert.findAll({
      where:  { user_id: req.user.id },
      order:  [['created_at', 'DESC']],
    });
    return ApiResponse.success(res, { data: alerts });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
});

// POST /alerts
router.post('/', async (req, res) => {
  try {
    const { symbol, exchange, condition, target_value, notes } = req.body;
    if (!symbol || !condition || !target_value) {
      return ApiResponse.badRequest(res, 'symbol, condition, and target_value are required');
    }
    const alert = await PriceAlert.create({
      user_id:      req.user.id,
      symbol:       symbol.toUpperCase(),
      exchange:     exchange || 'NSE',
      condition,
      target_value: parseFloat(target_value),
      notes:        notes || null,
    });
    return ApiResponse.created(res, {
      message: `Price alert set for ${symbol}`,
      data:    alert,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
});

// DELETE /alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    const alert = await PriceAlert.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!alert) return ApiResponse.notFound(res, 'Alert not found');
    await alert.destroy();
    return ApiResponse.success(res, { message: 'Alert deleted' });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
});

// PUT /alerts/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  try {
    const alert = await PriceAlert.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!alert) return ApiResponse.notFound(res, 'Alert not found');
    await alert.update({ is_active: !alert.is_active });
    return ApiResponse.success(res, {
      message: `Alert ${alert.is_active ? 'activated' : 'deactivated'}`,
      data:    alert,
    });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
});

export default router;