// ============================================
// Watchlist Controller
// ============================================
import watchlistService from '../services/watchlistService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ActivityLog } from '../Models/nosql/index.js';
import logger from '../utils/logger.js';

export const getWatchlists = async (req, res) => {
  try {
    const wls = await watchlistService.getUserWatchlists(req.user.id);
    return ApiResponse.success(res, { data: wls });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

export const createWatchlist = async (req, res) => {
  try {
    const wl = await watchlistService.createWatchlist(req.user.id, req.body);

    await ActivityLog.create({
      user_id: req.user.id, action: 'watchlist_created', category: 'watchlist',
      description: `Created watchlist: ${wl.name}`, ip_address: req.ip,
    });

    return ApiResponse.created(res, {
      message: `Watchlist "${wl.name}" created`,
      data:    wl,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

export const updateWatchlist = async (req, res) => {
  try {
    const wl = await watchlistService.updateWatchlist(
      req.user.id, req.params.id, req.body
    );
    return ApiResponse.success(res, {
      message: 'Watchlist updated', data: wl,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

export const deleteWatchlist = async (req, res) => {
  try {
    await watchlistService.deleteWatchlist(req.user.id, req.params.id);

    await ActivityLog.create({
      user_id: req.user.id, action: 'watchlist_deleted', category: 'watchlist',
      description: `Deleted watchlist ${req.params.id}`, ip_address: req.ip,
    });

    return ApiResponse.success(res, { message: 'Watchlist deleted' });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

export const addItem = async (req, res) => {
  try {
    const item = await watchlistService.addWatchlistItem(
      req.user.id, req.params.id, req.body
    );

    await ActivityLog.create({
      user_id: req.user.id, action: 'watchlist_item_added', category: 'watchlist',
      description: `Added ${req.body.symbol} to watchlist`, ip_address: req.ip,
    });

    return ApiResponse.created(res, {
      message: `${req.body.symbol} added to watchlist`,
      data:    item,
    });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

export const removeItem = async (req, res) => {
  try {
    await watchlistService.removeWatchlistItem(
      req.user.id, req.params.watchlistId, req.params.itemId
    );

    await ActivityLog.create({
      user_id: req.user.id, action: 'watchlist_item_removed', category: 'watchlist',
      description: `Removed stock from watchlist`, ip_address: req.ip,
    });

    return ApiResponse.success(res, { message: 'Stock removed from watchlist' });
  } catch (error) {
    return ApiResponse.badRequest(res, error.message);
  }
};

export default {
  getWatchlists,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  addItem,
  removeItem,
};