// ============================================
// Fund Controller
// ============================================
import fundService from '../services/fundService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ActivityLog } from '../Models/nosql/index.js';
import logger from '../utils/logger.js';

// ─── GET /funds ────────────────────────────
export const getFunds = async (req, res) => {
  try {
    const fund = await fundService.getFundBalance(req.user.id);
    return ApiResponse.success(res, { data: fund });
  } catch (error) {
    logger.error('GetFunds error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── POST /funds/deposit ───────────────────
export const deposit = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return ApiResponse.badRequest(res, 'Invalid deposit amount');
    }

    const result = await fundService.depositFunds(
      req.user.id, parseFloat(amount), description
    );

    await ActivityLog.create({
      user_id:     req.user.id,
      action:      'fund_deposited',
      category:    'funds',
      description: `Deposited ₹${parseFloat(amount).toLocaleString('en-IN')} to virtual account`,
      metadata:    { amount, new_balance: result.fund.available_balance },
      ip_address:  req.ip,
    });

    return ApiResponse.success(res, {
      message: `₹${parseFloat(amount).toLocaleString('en-IN')} added to your account`,
      data:    result,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

// ─── POST /funds/withdraw ──────────────────
export const withdraw = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return ApiResponse.badRequest(res, 'Invalid withdrawal amount');
    }

    const result = await fundService.withdrawFunds(
      req.user.id, parseFloat(amount), description
    );

    await ActivityLog.create({
      user_id:     req.user.id,
      action:      'fund_withdrawn',
      category:    'funds',
      description: `Withdrew ₹${parseFloat(amount).toLocaleString('en-IN')} from virtual account`,
      metadata:    { amount, new_balance: result.fund.available_balance },
      ip_address:  req.ip,
    });

    return ApiResponse.success(res, {
      message: `₹${parseFloat(amount).toLocaleString('en-IN')} withdrawn successfully`,
      data:    result,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

// ─── GET /funds/transactions ───────────────
export const getTransactions = async (req, res) => {
  try {
    const result = await fundService.getTransactionHistory(req.user.id, req.query);
    return ApiResponse.success(res, {
      data: result.transactions,
      meta: result.pagination,
    });
  } catch (error) {
    logger.error('GetTransactions error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

export default {
  getFunds,
  deposit,
  withdraw,
  getTransactions,
};