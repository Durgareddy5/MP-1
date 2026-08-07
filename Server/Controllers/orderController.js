// ============================================
// Order Controller
// ============================================
import orderService from '../services/orderService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ActivityLog } from '../Models/nosql/index.js';
import { Order } from '../Models/sql/index.js';
import logger from '../utils/logger.js';

// ─── POST /orders ──────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const order = await orderService.placeOrder(req.user.id, req.body);

    // Log activity
    await ActivityLog.create({
      user_id:     req.user.id,
      action:      'order_placed',
      category:    'trading',
      entity_type: 'order',
      entity_id:   order.id,
      description: `${req.body.transaction_type.toUpperCase()} ${req.body.quantity} ${req.body.symbol} via ${req.body.order_type} order`,
      metadata:    { order_number: order.order_number, status: order.status },
      ip_address:  req.ip,
    });

    return ApiResponse.created(res, {
      message: `Order placed successfully. Status: ${order.status}`,
      data:    order,
    });
  } catch (error) {
    logger.error('PlaceOrder error:', { error: error.message, userId: req.user.id });
    return ApiResponse.badRequest(res, error.message);
  }
};

// ─── GET /orders ───────────────────────────
export const getOrders = async (req, res) => {
  try {
    const result = await orderService.getUserOrders(req.user.id, req.query);
    return ApiResponse.success(res, {
      data: result.orders,
      meta: result.pagination,
    });
  } catch (error) {
    logger.error('GetOrders error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── GET /orders/:id ───────────────────────
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!order) return ApiResponse.notFound(res, 'Order not found');
    return ApiResponse.success(res, { data: order });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

// ─── PUT /orders/:id ──────────────────────
export const modifyOrder = async (req, res) => {
  try {
    const order = await orderService.modifyOrder(
      req.user.id, req.params.id, req.body
    );
    return ApiResponse.success(res, {
      message: 'Order modified successfully',
      data:    order,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

// ─── PUT /orders/:id/cancel ────────────────
export const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.user.id, req.params.id);

    await ActivityLog.create({
      user_id:     req.user.id,
      action:      'order_cancelled',
      category:    'trading',
      entity_type: 'order',
      entity_id:   order.id,
      description: `Order ${order.order_number} cancelled`,
      ip_address:  req.ip,
    });

    return ApiResponse.success(res, {
      message: 'Order cancelled successfully',
      data:    order,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

export default {
  placeOrder,
  getOrders,
  getOrderById,
  modifyOrder,
  cancelOrder,
};