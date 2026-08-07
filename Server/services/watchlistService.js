// ============================================
// Watchlist Service
// ============================================
import { Watchlist, WatchlistItem } from '../Models/sql/index.js';
import { Op } from 'sequelize';
import { WATCHLIST_LIMITS } from '../utils/constants.js';

const WATCHLIST_LIMITS_OBJ = { MAX_WATCHLISTS: 10, MAX_STOCKS: 50 };

// ─── Get all watchlists for user ───────────
const getUserWatchlists = async (userId) => {
  return Watchlist.findAll({
    where:   { user_id: userId, is_active: true },
    include: [{ model: WatchlistItem, as: 'items', order: [['sort_order','ASC']] }],
    order:   [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });
};

// ─── Create watchlist ──────────────────────
const createWatchlist = async (userId, data) => {
  const count = await Watchlist.count({ where: { user_id: userId, is_active: true } });
  if (count >= WATCHLIST_LIMITS_OBJ.MAX_WATCHLISTS) {
    throw new Error(`Maximum ${WATCHLIST_LIMITS_OBJ.MAX_WATCHLISTS} watchlists allowed`);
  }

  const duplicate = await Watchlist.findOne({
    where: { user_id: userId, name: data.name, is_active: true },
  });
  if (duplicate) throw new Error('A watchlist with this name already exists');

  return Watchlist.create({
    user_id:    userId,
    name:       data.name,
    description:data.description || null,
    color:      data.color || '#0052FF',
    icon:       data.icon  || 'star',
    sort_order: count,
    is_default: count === 0, // first watchlist is default
  });
};

// ─── Update watchlist ──────────────────────
const updateWatchlist = async (userId, watchlistId, data) => {
  const wl = await Watchlist.findOne({ where: { id: watchlistId, user_id: userId } });
  if (!wl) throw new Error('Watchlist not found');

  const allowed = ['name','description','color','icon','sort_order'];
  const patch   = {};
  allowed.forEach((k) => { if (data[k] !== undefined) patch[k] = data[k]; });

  await wl.update(patch);
  return wl;
};

// ─── Delete watchlist ──────────────────────
const deleteWatchlist = async (userId, watchlistId) => {
  const wl = await Watchlist.findOne({ where: { id: watchlistId, user_id: userId } });
  if (!wl) throw new Error('Watchlist not found');

  await WatchlistItem.destroy({ where: { watchlist_id: watchlistId } });
  await wl.destroy();
  return true;
};

// ─── Add stock to watchlist ────────────────
const addWatchlistItem = async (userId, watchlistId, data) => {
  const wl = await Watchlist.findOne({ where: { id: watchlistId, user_id: userId } });
  if (!wl) throw new Error('Watchlist not found');

  const count = await WatchlistItem.count({ where: { watchlist_id: watchlistId } });
  if (count >= WATCHLIST_LIMITS_OBJ.MAX_STOCKS) {
    throw new Error(`Maximum ${WATCHLIST_LIMITS_OBJ.MAX_STOCKS} stocks per watchlist`);
  }

  const existing = await WatchlistItem.findOne({
    where: {
      watchlist_id: watchlistId,
      symbol:       data.symbol.toUpperCase(),
      exchange:     data.exchange || 'NSE',
    },
  });
  if (existing) throw new Error(`${data.symbol} is already in this watchlist`);

  return WatchlistItem.create({
    watchlist_id: watchlistId,
    user_id:      userId,
    symbol:       data.symbol.toUpperCase(),
    stock_name:   data.stock_name || null,
    exchange:     data.exchange   || 'NSE',
    sort_order:   count,
    notes:        data.notes      || null,
    price_alert_high: data.price_alert_high || null,
    price_alert_low:  data.price_alert_low  || null,
  });
};

// ─── Remove stock from watchlist ───────────
const removeWatchlistItem = async (userId, watchlistId, itemId) => {
  const item = await WatchlistItem.findOne({
    where: { id: itemId, watchlist_id: watchlistId, user_id: userId },
  });
  if (!item) throw new Error('Watchlist item not found');
  await item.destroy();
  return true;
};

export {
  getUserWatchlists, createWatchlist, updateWatchlist,
  deleteWatchlist, addWatchlistItem, removeWatchlistItem,
};

export default {
  getUserWatchlists,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
};