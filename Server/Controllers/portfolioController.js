// ============================================
// Portfolio Controller
// ============================================
import portfolioService from '../services/portfolioService.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

// ─── GET /portfolio/holdings ───────────────
export const getHoldings = async (req, res) => {
  try {
    const holdings = await portfolioService.getHoldings(req.user.id);
    return ApiResponse.success(res, {
      data: holdings,
      meta: { count: holdings.length },
    });
  } catch (error) {
    logger.error('GetHoldings error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── POST /portfolio/positions/squareoff-all ─
export const squareOffAllPositions = async (req, res) => {
  try {
    const result = await portfolioService.squareOffAllPositions(req.user.id);
    return ApiResponse.success(res, {
      data: result,
      message: 'All positions squared off successfully',
    });
  } catch (error) {
    logger.error('SquareOffAllPositions error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

// ─── GET /portfolio/positions ──────────────
export const getPositions = async (req, res) => {
  try {
    const status    = req.query.status || null;
    const positions = await portfolioService.getPositions(req.user.id, status);
    return ApiResponse.success(res, {
      data: positions,
      meta: { count: positions.length },
    });
  } catch (error) {
    logger.error('GetPositions error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── POST /portfolio/positions/:id/squareoff ─
export const squareOffPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const position = await portfolioService.squareOffPosition(req.user.id, id);
    return ApiResponse.success(res, {
      data: position,
      message: 'Position squared off successfully',
    });
  } catch (error) {
    logger.error('SquareOffPosition error:', { error: error.message });
    if (error.statusCode === 404) {
      return ApiResponse.notFound(res, error.message);
    }
    return ApiResponse.serverError(res, error.message);
  }
};

// ─── GET /portfolio/summary ────────────────
export const getPortfolioSummary = async (req, res) => {
  try {
    const summary = await portfolioService.getPortfolioSummary(req.user.id);
    return ApiResponse.success(res, { data: summary });
  } catch (error) {
    logger.error('GetPortfolioSummary error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── GET /trades ───────────────────────────
export const getTradeLogs = async (req, res) => {
  try {
    const result = await portfolioService.getTradeLogs(req.user.id, req.query);
    return ApiResponse.success(res, {
      data: {
        trades: result.trades,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('GetTradeLogs error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

// ─── GET /portfolio/analytics ──────────────
export const getAnalytics = async (req, res) => {
  try {
    const period = req.query.period || '1Y';
    const analytics = await portfolioService.getAnalytics(req.user.id, { period });
    return ApiResponse.success(res, { data: analytics });
  } catch (error) {
    logger.error('GetAnalytics error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

export const getPortfolioTrend = async (req, res) => {
  try {
    const days = Number.parseInt(req.query.days, 10) || 30;
    const trend = await portfolioService.getPortfolioTrend(req.user.id, { days });
    return ApiResponse.success(res, { data: trend });
  } catch (error) {
    logger.error('GetPortfolioTrend error:', { error: error.message });
    return ApiResponse.serverError(res);
  }
};

export default {
  getHoldings,
  getPositions,
  squareOffPosition,
  squareOffAllPositions,
  getPortfolioSummary,
  getTradeLogs,
  getAnalytics,
  getPortfolioTrend,
};