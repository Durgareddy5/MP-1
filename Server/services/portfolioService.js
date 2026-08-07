// ============================================
// Portfolio Service — Holdings, Positions, P&L
// ============================================
import { Holding, Position, TradeLog, Fund, PortfolioSnapshot } from '../Models/sql/index.js';
import { Op } from 'sequelize';
import { getStockPrice } from './orderService.js';
import logger from '../utils/logger.js';

const PERIOD_MONTHS = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getPeriodCutoff = (period) => {
  if (!period || period === 'All') return null;
  const months = PERIOD_MONTHS[period] || 12;
  const now = new Date();
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (d) => d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
const dayKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const computeRealizedPnL = (trades) => {
  // FIFO matching with support for both long and short selling.
  // - Long lots opened by BUY, closed by SELL => pnl = (sell - buy) * qty
  // - Short lots opened by SELL, closed by BUY => pnl = (sell - buy) * qty
  const longLotsBySymbol = new Map();
  const shortLotsBySymbol = new Map();
  const closes = [];

  const sorted = [...trades].sort((a, b) => new Date(a.executed_at) - new Date(b.executed_at));

  for (const t of sorted) {
    const symbol = String(t.symbol || '').toUpperCase();
    if (!symbol) continue;

    const qty = toNumber(t.quantity);
    const price = toNumber(t.price);
    if (!qty || !price) continue;

    const side = String(t.transaction_type || '').toLowerCase();
    const executedAt = new Date(t.executed_at || Date.now());

    const longLots = longLotsBySymbol.get(symbol) || [];
    const shortLots = shortLotsBySymbol.get(symbol) || [];

    if (side === 'buy') {
      // First close shorts (buy to cover)
      let remaining = qty;
      let realized = 0;
      let invested = 0;
      let closedQty = 0;

      while (remaining > 0 && shortLots.length > 0) {
        const lot = shortLots[0];
        const closeQty = Math.min(remaining, lot.qty);
        // short pnl: sold at lot.price, bought back at price
        realized += (lot.price - price) * closeQty;
        invested += lot.price * closeQty;

        lot.qty -= closeQty;
        remaining -= closeQty;
        closedQty += closeQty;

        if (lot.qty <= 0) shortLots.shift();
      }

      if (closedQty > 0) {
        closes.push({
          symbol,
          executed_at: executedAt.toISOString(),
          pnl: realized,
          invested,
          type: 'buy',
        });
      }

      // Remaining opens new long
      if (remaining > 0) {
        longLots.push({ qty: remaining, price });
      }

      longLotsBySymbol.set(symbol, longLots);
      shortLotsBySymbol.set(symbol, shortLots);
      continue;
    }

    if (side === 'sell') {
      // First close longs
      let remaining = qty;
      let realized = 0;
      let invested = 0;
      let closedQty = 0;

      while (remaining > 0 && longLots.length > 0) {
        const lot = longLots[0];
        const closeQty = Math.min(remaining, lot.qty);
        realized += (price - lot.price) * closeQty;
        invested += lot.price * closeQty;

        lot.qty -= closeQty;
        remaining -= closeQty;
        closedQty += closeQty;

        if (lot.qty <= 0) longLots.shift();
      }

      if (closedQty > 0) {
        closes.push({
          symbol,
          executed_at: executedAt.toISOString(),
          pnl: realized,
          invested,
          type: 'sell',
        });
      }

      // Remaining opens new short
      if (remaining > 0) {
        shortLots.push({ qty: remaining, price });
      }

      longLotsBySymbol.set(symbol, longLots);
      shortLotsBySymbol.set(symbol, shortLots);
    }
  }

  return closes;
};

// ─── Get all holdings with live P&L ───────
const getHoldings = async (userId) => {
  const holdings = await Holding.findAll({
    where:   { user_id: userId, quantity: { [Op.gt]: 0 } },
    order:   [['current_value', 'DESC']],
  });

  // Update current prices and P&L
  const updated = await Promise.all(
    holdings.map(async (h) => {
      try {
        const livePrice = await getStockPrice(h.symbol);
        const currValue = +(h.quantity * livePrice).toFixed(2);
        const pnl       = +(currValue - +h.total_invested).toFixed(2);
        const pnlPct    = +h.total_invested > 0
          ? +((pnl / +h.total_invested) * 100).toFixed(4)
          : 0;

        await h.update({
          current_price:     livePrice,
          current_value:     currValue,
          pnl,
          pnl_percentage:    pnlPct,
        });
        return h;
      } catch (_) { return h; }
    })
  );

  return updated;
};

// ─── Square off (close) a position ─────────
const squareOffPosition = async (userId, positionId) => {
  const position = await Position.findOne({
    where: {
      id: positionId,
      user_id: userId,
    },
  });

  if (!position) {
    const err = new Error('Position not found');
    err.statusCode = 404;
    throw err;
  }

  if (position.status === 'closed') {
    return position;
  }

  await position.update({
    status: 'closed',
    closed_at: new Date(),
    realized_pnl: Number(position.total_pnl || 0),
    unrealized_pnl: 0,
    net_quantity: 0,
  });

  return position;
};

// ─── Square off (close) ALL open positions ───
const squareOffAllPositions = async (userId) => {
  const positions = await Position.findAll({
    where: {
      user_id: userId,
      status: 'open',
    },
    order: [['opened_at', 'DESC']],
  });

  if (!positions.length) {
    return { count: 0, total_realized_pnl: 0 };
  }

  const totalRealized = positions.reduce((s, p) => s + Number(p.total_pnl || 0), 0);

  await Promise.all(
    positions.map((p) => p.update({
      status: 'closed',
      closed_at: new Date(),
      realized_pnl: Number(p.total_pnl || 0),
      unrealized_pnl: 0,
      net_quantity: 0,
    }))
  );

  return { count: positions.length, total_realized_pnl: totalRealized };
};

// ─── Portfolio Summary ─────────────────────
const getPortfolioSummary = async (userId) => {
  const [holdings, fund, positions] = await Promise.all([
    Holding.findAll({
      where: { user_id: userId, quantity: { [Op.gt]: 0 } },
    }),
    Fund.findOne({ where: { user_id: userId } }),
    Position.findAll({ where: { user_id: userId, status: 'open' } }),
  ]);

  const totalInvested    = holdings.reduce((s, h) => s + +h.total_invested, 0);
  const totalCurrentVal  = holdings.reduce((s, h) => s + +h.current_value,  0);
  const totalPnL         = totalCurrentVal - totalInvested;
  const totalPnLPct      = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const dayChange        = holdings.reduce((s, h) => s + +h.day_change, 0);
  const unrealizedPos    = positions.reduce((s, p) => s + +p.unrealized_pnl, 0);

  return {
    total_invested:           +totalInvested.toFixed(2),
    current_value:            +totalCurrentVal.toFixed(2),
    total_pnl:                +totalPnL.toFixed(2),
    total_pnl_percentage:     +totalPnLPct.toFixed(4),
    day_change:               +dayChange.toFixed(2),
    day_change_percentage:    totalInvested > 0
      ? +((dayChange / totalInvested) * 100).toFixed(4) : 0,
    available_balance:        fund ? +fund.available_balance : 0,
    total_balance:            fund ? +fund.total_balance     : 0,
    used_margin:              fund ? +fund.used_margin       : 0,
    realized_pnl:             fund ? +fund.realized_pnl      : 0,
    unrealized_pnl_positions: +unrealizedPos.toFixed(2),
    open_positions_count:     positions.length,
    holdings_count:           holdings.length,
  };
};

// ─── Get positions ─────────────────────────
const getPositions = async (userId, status = null) => {
  const where = { user_id: userId };
  if (status) where.status = status;

  const positions = await Position.findAll({
    where,
    order: [['opened_at', 'DESC']],
  });

  // Update unrealized P&L
  const updated = await Promise.all(
    positions.map(async (p) => {
      try {
        const livePrice     = await getStockPrice(p.symbol);
        let unrealized      = 0;

        if (p.net_quantity > 0) {
          unrealized = (livePrice - +p.buy_average_price) * p.net_quantity;
        } else if (p.net_quantity < 0) {
          unrealized = (+p.sell_average_price - livePrice) * Math.abs(p.net_quantity);
        }

        await p.update({
          current_price:    livePrice,
          unrealized_pnl:   +unrealized.toFixed(2),
          total_pnl:        +(+p.realized_pnl + unrealized).toFixed(2),
        });
        return p;
      } catch (_) { return p; }
    })
  );

  return updated;
};

// ─── Trade logs ────────────────────────────
const getTradeLogs = async (userId, filters = {}) => {
  const where  = { user_id: userId };
  const page   = parseInt(filters.page,  10) || 1;
  const limit  = Math.min(parseInt(filters.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  if (filters.symbol) where.symbol = filters.symbol.toUpperCase();
  if (filters.type)   where.transaction_type = filters.type;

  const { count, rows } = await TradeLog.findAndCountAll({
    where,
    order:   [['executed_at', 'DESC']],
    limit,
    offset,
  });

  return {
    trades: rows,
    pagination: {
      total:       count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    },
  };
};

// ─── Analytics (server-side) ───────────────
const getAnalytics = async (userId, filters = {}) => {
  const cutoff = getPeriodCutoff(filters.period);

  const tradesWhere = { user_id: userId };
  if (cutoff) {
    tradesWhere.executed_at = { [Op.gte]: cutoff };
  }

  const [trades, holdings] = await Promise.all([
    TradeLog.findAll({
      where: tradesWhere,
      order: [['executed_at', 'ASC']],
      limit: 10000,
    }),
    Holding.findAll({
      where: { user_id: userId, quantity: { [Op.gt]: 0 } },
    }),
  ]);

  const normalizedTrades = (trades || []).map((t) => ({
    ...(typeof t?.toJSON === 'function' ? t.toJSON() : t),
    quantity: toNumber(t.quantity),
    price: toNumber(t.price),
    total_value: toNumber(t.total_value),
    total_charges: toNumber(t.total_charges),
    net_value: toNumber(t.net_value),
  }));

  const closes = computeRealizedPnL(normalizedTrades);

  // Monthly PnL
  const byMonth = new Map();
  for (const c of closes) {
    const d = new Date(c.executed_at);
    const key = monthKey(d);
    const existing = byMonth.get(key) || { month: monthLabel(d), pnl: 0, trades: 0 };
    existing.pnl += toNumber(c.pnl);
    existing.trades += 1;
    byMonth.set(key, existing);
  }

  const monthly_pnl = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({
      ...v,
      pnl: Math.round(toNumber(v.pnl)),
    }));

  // Win/Loss stats
  const pnls = closes.map((c) => toNumber(c.pnl));
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  const avgWin = wins.length ? wins.reduce((s, p) => s + p, 0) / wins.length : 0;
  const avgLossAbs = losses.length ? Math.abs(losses.reduce((s, p) => s + p, 0) / losses.length) : 0;
  const bestTrade = pnls.length ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length ? Math.min(...pnls) : 0;
  const totalTrades = pnls.length;
  const winningPct = totalTrades ? Math.round((wins.length / totalTrades) * 100) : 0;
  const losingPct = totalTrades ? 100 - winningPct : 0;

  let winStreak = 0;
  let lossStreak = 0;
  let currentWin = 0;
  let currentLoss = 0;
  for (const c of closes) {
    const pnl = toNumber(c.pnl);
    if (pnl > 0) {
      currentWin += 1;
      currentLoss = 0;
      winStreak = Math.max(winStreak, currentWin);
    } else if (pnl < 0) {
      currentLoss += 1;
      currentWin = 0;
      lossStreak = Math.max(lossStreak, currentLoss);
    }
  }

  const win_rate = {
    winning: winningPct,
    losing: losingPct,
    avgWin: Math.round(avgWin),
    avgLoss: Math.round(avgLossAbs),
    bestTrade: Math.round(bestTrade),
    worstTrade: Math.round(worstTrade),
    totalTrades,
    winStreak,
    lossStreak,
  };

  // Sector allocation
  const normalizedHoldings = (holdings || []).map((h) => ({
    ...(typeof h?.toJSON === 'function' ? h.toJSON() : h),
    quantity: toNumber(h.quantity),
    current_price: toNumber(h.current_price),
  }));

  const bySector = new Map();
  let totalValue = 0;
  for (const h of normalizedHoldings) {
    const sector = String(h.sector || 'Other');
    const value = toNumber(h.quantity) * toNumber(h.current_price);
    totalValue += value;
    bySector.set(sector, (bySector.get(sector) || 0) + value);
  }

  const sector_alloc = [...bySector.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
    }));

  // Top trades
  const top_trades = [...closes]
    .sort((a, b) => Math.abs(toNumber(b.pnl)) - Math.abs(toNumber(a.pnl)))
    .slice(0, 5)
    .map((c) => {
      const d = new Date(c.executed_at);
      const invested = toNumber(c.invested);
      const pnl = toNumber(c.pnl);
      const pct = invested > 0 ? (pnl / invested) * 100 : 0;
      return {
        symbol: c.symbol,
        date: d.toISOString(),
        type: c.type,
        pnl: Math.round(pnl),
        pct,
      };
    });

  return {
    period: filters.period || '1Y',
    monthly_pnl,
    win_rate,
    sector_alloc,
    top_trades,
  };
};

const getPortfolioTrend = async (userId, options = {}) => {
  const days = Math.max(7, Math.min(Number(options.days || 30), 365));
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));

  const summary = await getPortfolioSummary(userId);
  const todayKey = dayKey(today);

  await PortfolioSnapshot.upsert({
    user_id: userId,
    snapshot_date: todayKey,
    equity_value: Number(summary.current_value || 0),
    invested_value: Number(summary.total_invested || 0),
    pnl_value: Number(summary.total_pnl || 0),
  });

  const snapshots = await PortfolioSnapshot.findAll({
    where: {
      user_id: userId,
      snapshot_date: { [Op.gte]: dayKey(from) },
    },
    order: [['snapshot_date', 'ASC']],
  });

  const byDate = new Map(
    (snapshots || []).map((s) => [
      String(s.snapshot_date),
      {
        equity_value: Number(s.equity_value || 0),
        invested_value: Number(s.invested_value || 0),
        pnl_value: Number(s.pnl_value || 0),
      },
    ])
  );

  let lastEquity = Number(summary.current_value || 0);
  let lastInvested = Number(summary.total_invested || 0);
  let lastPnl = Number(summary.total_pnl || 0);

  const points = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = dayKey(d);
    const snap = byDate.get(key);

    if (snap) {
      lastEquity = snap.equity_value;
      lastInvested = snap.invested_value;
      lastPnl = snap.pnl_value;
    }

    points.push({
      date: key,
      equity_value: Number(lastEquity.toFixed(2)),
      invested_value: Number(lastInvested.toFixed(2)),
      pnl_value: Number(lastPnl.toFixed(2)),
    });
  }

  return {
    days,
    points,
  };
};

export {
  getHoldings,
  getPortfolioSummary,
  getPositions,
  squareOffPosition,
  squareOffAllPositions,
  getTradeLogs,
  getAnalytics,
  getPortfolioTrend,
};

export default {
  getHoldings,
  getPortfolioSummary,
  getPositions,
  squareOffPosition,
  squareOffAllPositions,
  getTradeLogs,
  getAnalytics,
  getPortfolioTrend,
};