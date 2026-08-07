// ============================================
// Market Controller
// ============================================
import marketService from '../services/marketService.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

export const getMarketStatus = async (req, res) => {
  try {
    return ApiResponse.success(res, { data: marketService.getStatus() });
  } catch (error) {
    logger.error('GetMarketStatus error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getAllIndices = async (req, res) => {
  try {
    const indices = await marketService.getAllIndices();
    return ApiResponse.success(res, {
      data: indices,
      meta: {
        count: indices.length,
        market_status: marketService.getStatus(),
      },
    });
  } catch (error) {
    logger.error('GetAllIndices error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const searchStocks = async (req, res) => {
  try {
    const { q, limit, exchange } = req.query;

    logger.info('Market search request', {
      q,
      limit,
      exchange,
      path: req.originalUrl,
    });

    if (!q || q.trim().length < 1) {
      return ApiResponse.badRequest(res, 'Search query is required');
    }

    const results = await marketService.searchStocks(
      q.trim(),
      Number.parseInt(limit, 10) || 15,
      exchange || undefined
    );

    logger.info('Market search results', {
      q,
      count: Array.isArray(results) ? results.length : 0,
    });

    return ApiResponse.success(res, {
      data: results,
      meta: {
        query: q,
        exchange: exchange || 'all',
        count: results.length,
      },
    });
  } catch (error) {
    logger.error('SearchStocks error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await marketService.getStockQuote(symbol);
    return ApiResponse.success(res, { data: quote });
  } catch (error) {
    logger.error('GetStockQuote error:', { error: error.message });
    if (error?.code === 'SYMBOL_NOT_FOUND') {
      return ApiResponse.notFound(res, error.message);
    }

    return ApiResponse.error(res, {
      statusCode: 502,
      message: error?.message || 'Upstream quote provider error',
      code: 'UPSTREAM_QUOTE_ERROR',
    });
  }
};

export const getStockDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await marketService.getStockQuote(symbol);
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetStockDetails error:', { error: error.message });
    return ApiResponse.notFound(res, error.message);
  }
};

export const getStockHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { start, end, interval } = req.query;

    const period1 = start ? new Date(start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const period2 = end ? new Date(end) : new Date();

    if (Number.isNaN(period1.getTime()) || Number.isNaN(period2.getTime())) {
      return ApiResponse.badRequest(res, 'Invalid start/end date');
    }

    const candles = await marketService.getHistorical({
      symbol,
      period1,
      period2,
      interval: interval || '1d',
    });

    return ApiResponse.success(res, {
      data: {
        symbol,
        interval: interval || '1d',
        candles,
      },
      meta: {
        count: candles.length,
      },
    });
  } catch (error) {
    logger.error('GetStockHistory error:', { error: error.message });
    return ApiResponse.error(res, {
      message: error.message || 'Failed to load historical data',
      statusCode: 400,
      code: 'HISTORICAL_FETCH_FAILED',
    });
  }
};

export const getTopGainers = async (req, res) => {
  try {
    const data = await marketService.getTopGainers(
      Number.parseInt(req.query.limit, 10) || 10
    );
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetTopGainers error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getTopLosers = async (req, res) => {
  try {
    const data = await marketService.getTopLosers(
      Number.parseInt(req.query.limit, 10) || 10
    );
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetTopLosers error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getMostActive = async (req, res) => {
  try {
    const data = await marketService.getMostActive(
      Number.parseInt(req.query.limit, 10) || 10
    );
    return ApiResponse.success(res, { data });
  } catch (error) {
    logger.error('GetMostActive error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const refreshInstrumentMaster = async (req, res) => {
  try {
    const result = await marketService.refreshInstrumentMaster();
    return ApiResponse.success(res, {
      data: result,
      message: 'Instrument master refreshed successfully',
    });
  } catch (error) {
    logger.error('RefreshInstrumentMaster error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export const getInstrumentMasterStats = async (req, res) => {
  try {
    const result = await marketService.getInstrumentMasterStats();
    return ApiResponse.success(res, { data: result });
  } catch (error) {
    logger.error('GetInstrumentMasterStats error:', { error: error.message });
    return ApiResponse.serverError(res, error.message);
  }
};

export default {
  getMarketStatus,
  getAllIndices,
  searchStocks,
  getStockQuote,
  getStockDetails,
  getStockHistory,
  getTopGainers,
  getTopLosers,
  getMostActive,
  refreshInstrumentMaster,
  getInstrumentMasterStats,
};
