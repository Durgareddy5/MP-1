// ============================================
// Order Service — Paper Trading Engine
// Core logic for placing, modifying, executing
// and cancelling simulated orders
// ============================================

import { Op } from 'sequelize';
import { sequelize } from '../config/mysql.js';
import {
  Order, Fund, FundTransaction, Holding,
  Position, TradeLog,
} from '../Models/sql/index.js';
import { StockData } from '../Models/nosql/index.js';
import { generateOrderNumber, generateTradeNumber,
        isMarketOpen, getMarketStatus,
        calculateCharges } from '../utils/helpers.js';
import { ORDER_STATUSES, PRODUCT_TYPES } from '../utils/constants.js';
import logger from '../utils/logger.js';

// ─── Simulate live price fetch ─────────────
// In production this will call Yahoo Finance / Alpha Vantage
const getStockPrice = async (symbol) => {
  try {
    const doc = await StockData.findOne({ symbol: symbol.toUpperCase() });
    if (doc?.quote?.price) return doc.quote.price;
  } catch (_) {}

  // Fallback mock prices for paper trading
  const mock = {
    RELIANCE: 1285.50, TCS: 3542.80, HDFCBANK: 1672.30,
    INFY: 1495.25, ICICIBANK: 1289.45, WIPRO: 472.65,
    SBIN: 812.40,  BHARTIARTL: 1628.75, SUNPHARMA: 1812.30,
    LT: 3542.15, ITC: 442.85, HINDUNILVR: 2684.50,
    KOTAKBANK: 1842.30, AXISBANK: 1142.75, TATAMOTORS: 738.90,
    MARUTI: 11842.50, BAJFINANCE: 6842.30, NESTLEIND: 2486.30,
    ADANIENT: 2384.60, TITAN: 3284.40, HCLTECH: 1638.40,
    TECHM: 1524.60, DRREDDY: 5842.30, CIPLA: 1384.20,
    COALINDIA: 442.85, ONGC: 284.50, NTPC: 342.60,
    POWERGRID: 284.30, ULTRACEM: 10842.30, JSWSTEEL: 924.30,
    TATASTEEL: 142.80, HINDALCO: 684.50, DIVISLAB: 4284.30,
    BRITANNIA: 5284.30, BAJAJFINSV: 1684.20, GRASIM: 2384.50,
    EICHERMOT: 4884.30, HEROMOTOCO: 4284.60, ASIANPAINT: 2284.30,
    NESTLEIND: 2486.30,
  };
  return mock[symbol.toUpperCase()] || (1000 + Math.random() * 2000);
};

// ═══════════════════════════════════════════
// PLACE ORDER
// ═══════════════════════════════════════════
const placeOrder = async (userId, orderData) => {
  const t = await sequelize.transaction();

  try {
    const {
    symbol, exchange = 'NSE', transaction_type,
    order_type, product_type = 'CNC',
    quantity, price, trigger_price,
    validity = 'DAY', notes, tag,
    } = orderData;

    // 🔥 NORMALIZE VALUES
    const normalizedProductType = (product_type || 'CNC').toUpperCase().trim();
    const normalizedTransactionType = (transaction_type || '').toLowerCase().trim();

    // 1. Get fund record
    const fund = await Fund.findOne({ where: { user_id: userId }, transaction: t });
    if (!fund) throw new Error('Fund account not found');

    // 2. Get current price
    const livePrice   = await getStockPrice(symbol);
    const execPrice   = order_type === 'market' ? livePrice : (price || livePrice);
    const orderValue  = quantity * execPrice;

    // 3. Calculate charges
    const chargesData = calculateCharges({
      transaction_type, product_type, quantity, price: execPrice,
    });

    // 4. Check available balance (for BUY orders)
    if (transaction_type === 'buy') {
      const totalRequired = orderValue + chargesData.total_charges;
      if (fund.available_balance < totalRequired) {
        throw new Error(
          `Insufficient funds. Required: ₹${totalRequired.toFixed(2)}, Available: ₹${fund.available_balance}`
        );
      }
    }

    // 5. For SELL — check if user has holdings
    if (transaction_type === 'sell' && product_type?.toUpperCase() === 'CNC') {
      const holding = await Holding.findOne({
        where: { user_id: userId, symbol: symbol.toUpperCase(), exchange },
        transaction: t,
      });
      if (!holding || holding.quantity < quantity) {
        throw new Error(
          `Insufficient holdings. You have ${holding?.quantity || 0} shares of ${symbol}.`
        );
      }
    }

    // 6. Determine initial status
    // Paper trading behavior:
    // - Market orders execute immediately (simulated fill)
    // - Limit/SL orders remain open (pending execution)
    const initStatus = order_type === 'market'
      ? ORDER_STATUSES.FILLED
      : ORDER_STATUSES.OPEN;

    // 7. Create order record
    const order = await Order.create({
      user_id:          userId,
      order_number:     generateOrderNumber(),
      symbol:           symbol.toUpperCase(),
      exchange,
      order_type,
      transaction_type,
      product_type,
      quantity,
      filled_quantity:  initStatus === ORDER_STATUSES.FILLED ? quantity : 0,
      pending_quantity: initStatus === ORDER_STATUSES.FILLED ? 0 : quantity,
      price:            order_type === 'market' ? null : price,
      trigger_price:    trigger_price || null,
      average_price:    initStatus === ORDER_STATUSES.FILLED ? execPrice : null,
      status:           initStatus,
      validity,
      brokerage:        chargesData.brokerage,
      stt:              chargesData.stt,
      transaction_charges: chargesData.transaction_charges,
      gst:              chargesData.gst,
      stamp_duty:       chargesData.stamp_duty,
      total_charges:    chargesData.total_charges,
      total_value:      initStatus === ORDER_STATUSES.FILLED ? orderValue : 0,
      executed_at:      initStatus === ORDER_STATUSES.FILLED ? new Date() : null,
      notes,
      tag,
    }, { transaction: t });

    // 8. If FILLED → update fund & portfolio
    if (initStatus === ORDER_STATUSES.FILLED) {
      await _executeFill(
      { userId, order, execPrice, orderValue, chargesData,
        transaction_type: normalizedTransactionType,
        product_type: normalizedProductType,
        symbol, exchange, quantity },
      t
      );
    } else {
      // Block amount for open limit/SL orders
      if (transaction_type === 'buy') {
        const blockAmt = orderValue + chargesData.total_charges;
        await fund.update({
          available_balance: +fund.available_balance - blockAmt,
          blocked_amount:    +fund.blocked_amount    + blockAmt,
        }, { transaction: t });

        await FundTransaction.create({
          user_id:         userId,
          transaction_type:'order_blocked',
          amount:          blockAmt,
          credit_debit:    'debit',
          balance_after:   +fund.available_balance - blockAmt,
          description:     `Blocked for ${order_type} order: BUY ${quantity} ${symbol}`,
          reference_type:  'order',
          reference_id:    order.id,
          status:          'completed',
        }, { transaction: t });
      }
    }

    await t.commit();

    logger.trade(`Order placed: ${order.order_number} | ${transaction_type.toUpperCase()} ${quantity} ${symbol} @ ${execPrice} | Status: ${initStatus}`);

    return order;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ─── Internal: execute a fill ─────────────
const _executeFill = async (
  { userId, order, execPrice, orderValue, chargesData,
    transaction_type, product_type, symbol, exchange, quantity },
  t
) => {
  const fund = await Fund.findOne({ where: { user_id: userId }, transaction: t });

  if (transaction_type === 'buy') {
    const totalDebit = orderValue + chargesData.total_charges;

    // Debit balance
    await fund.update({
      available_balance: +fund.available_balance - totalDebit,
      used_margin:       +fund.used_margin + (product_type === 'MIS' ? orderValue : 0),
    }, { transaction: t });

    // Fund transaction
    await FundTransaction.create({
      user_id: userId, transaction_type: 'buy_debit',
      amount: totalDebit, credit_debit: 'debit',
      balance_after: +fund.available_balance - totalDebit,
      description: `BUY ${quantity} ${symbol} @ ₹${execPrice}`,
      reference_type: 'order', reference_id: order.id,
      status: 'completed',
    }, { transaction: t });

    // Charges transaction
    if (chargesData.total_charges > 0) {
      await FundTransaction.create({
        user_id: userId, transaction_type: 'brokerage_debit',
        amount: chargesData.total_charges, credit_debit: 'debit',
        balance_after: +fund.available_balance - totalDebit,
        description: `Brokerage & charges for ${order.order_number}`,
        reference_type: 'order', reference_id: order.id,
        status: 'completed',
      }, { transaction: t });
    }

    // Update or create holding (CNC only)
    if (product_type?.toUpperCase() === 'CNC') {
      const existing = await Holding.findOne({
        where: { user_id: userId, symbol: symbol.toUpperCase(), exchange },
        transaction: t,
      });

      if (existing) {
        const newQty     = existing.quantity + quantity;
        const newAvgPrice = (
          (+existing.average_price * existing.quantity) +
          (execPrice * quantity)
        ) / newQty;

        await existing.update({
          quantity:        newQty,
          average_price:   +newAvgPrice.toFixed(4),
          total_invested:  +(newQty * newAvgPrice).toFixed(2),
          current_price:   execPrice,
          current_value:   +(newQty * execPrice).toFixed(2),
          last_traded_at:  new Date(),
        }, { transaction: t });
      } else {
        await Holding.create({
          user_id:        userId,
          symbol:         symbol.toUpperCase(),
          exchange,
          quantity,
          average_price:  execPrice,
          total_invested: +(quantity * execPrice).toFixed(2),
          current_price:  execPrice,
          current_value:  +(quantity * execPrice).toFixed(2),
          pnl:            0,
          pnl_percentage: 0,
          first_bought_at: new Date(),
          last_traded_at:  new Date(),
        }, { transaction: t });
      }
    }

    // Create/update position (broker-like: show intraday and same-day CNC positions)
    if (['MIS', 'CNC'].includes(String(product_type || '').toUpperCase())) {
      await _updatePosition(
        { userId, symbol, exchange, product_type, transaction_type,
          quantity, execPrice }, t
      );
    }
  } else {
    // SELL
    const netCredit = orderValue - chargesData.total_charges;

    await fund.update({
      available_balance: +fund.available_balance + netCredit,
    }, { transaction: t });

    await FundTransaction.create({
      user_id: userId, transaction_type: 'sell_credit',
      amount: netCredit, credit_debit: 'credit',
      balance_after: +fund.available_balance + netCredit,
      description: `SELL ${quantity} ${symbol} @ ₹${execPrice}`,
      reference_type: 'order', reference_id: order.id,
      status: 'completed',
    }, { transaction: t });

    // Reduce holding
    if (product_type === 'CNC') {
      const holding = await Holding.findOne({
        where: { user_id: userId, symbol: symbol.toUpperCase(), exchange },
        transaction: t,
      });

      if (holding) {
        const newQty  = holding.quantity - quantity;
        const realized = (execPrice - +holding.average_price) * quantity;

        if (newQty <= 0) {
          await holding.destroy({ transaction: t });
        } else {
          await holding.update({
            quantity:       newQty,
            total_invested: +(newQty * +holding.average_price).toFixed(2),
            current_value:  +(newQty * execPrice).toFixed(2),
            realized_pnl:   +(+holding.realized_pnl + realized).toFixed(2),
            last_traded_at: new Date(),
          }, { transaction: t });
        }

        // Update realized P&L on fund
        await fund.update({
          realized_pnl: +(+fund.realized_pnl + realized).toFixed(2),
        }, { transaction: t });
      }
    }

    if (['MIS', 'CNC'].includes(String(product_type || '').toUpperCase())) {
      await _updatePosition(
        { userId, symbol, exchange, product_type, transaction_type,
          quantity, execPrice }, t
      );
    }
  }

  // Create trade log entry
  const netVal = transaction_type === 'buy'
    ? orderValue + chargesData.total_charges
    : orderValue - chargesData.total_charges;

  await TradeLog.create({
    user_id:          userId,
    order_id:         order.id,
    trade_number:     generateTradeNumber(),
    symbol:           symbol.toUpperCase(),
    exchange,
    transaction_type,
    product_type,
    quantity,
    price:            execPrice,
    total_value:      orderValue,
    brokerage:        chargesData.brokerage,
    total_charges:    chargesData.total_charges,
    net_value:        netVal,
    executed_at:      new Date(),
  }, { transaction: t });
  console.log("DEBUG PRODUCT TYPE:", product_type);
  console.log("DEBUG TRANSACTION TYPE:", transaction_type);
};

// ─── MIS Position Update ───────────────────
const _updatePosition = async (
  { userId, symbol, exchange, product_type,
    transaction_type, quantity, execPrice }, t
) => {
  const today = new Date().toISOString().split('T')[0];
  let pos     = await Position.findOne({
    where: {
      user_id:       userId,
      symbol:        symbol.toUpperCase(),
      status:        'open',
      product_type,
    },
    transaction: t,
  });

  if (!pos) {
    pos = await Position.create({
      user_id:           userId,
      symbol:            symbol.toUpperCase(),
      exchange,
      product_type,
      position_type:     transaction_type === 'buy' ? 'long' : 'short',
      buy_quantity:      transaction_type === 'buy'  ? quantity : 0,
      sell_quantity:     transaction_type === 'sell' ? quantity : 0,
      net_quantity:      transaction_type === 'buy'  ? quantity : -quantity,
      buy_average_price: transaction_type === 'buy'  ? execPrice : 0,
      sell_average_price:transaction_type === 'sell' ? execPrice : 0,
      buy_value:         transaction_type === 'buy'  ? quantity * execPrice : 0,
      sell_value:        transaction_type === 'sell' ? quantity * execPrice : 0,
      current_price:     execPrice,
      status:            'open',
    }, { transaction: t });
  } else {
    const newBuyQty  = pos.buy_quantity  + (transaction_type === 'buy'  ? quantity : 0);
    const newSellQty = pos.sell_quantity + (transaction_type === 'sell' ? quantity : 0);
    const newBuyVal  = +pos.buy_value    + (transaction_type === 'buy'  ? quantity * execPrice : 0);
    const newSellVal = +pos.sell_value   + (transaction_type === 'sell' ? quantity * execPrice : 0);
    const netQty     = newBuyQty - newSellQty;

    const realizedPnL = transaction_type === 'sell' && pos.buy_average_price > 0
      ? (execPrice - +pos.buy_average_price) * quantity
      : 0;

    const newBuyAvg  = newBuyQty  > 0 ? newBuyVal  / newBuyQty  : 0;
    const newSellAvg = newSellQty > 0 ? newSellVal / newSellQty : 0;

    await pos.update({
      buy_quantity:       newBuyQty,
      sell_quantity:      newSellQty,
      net_quantity:       netQty,
      buy_average_price:  +newBuyAvg.toFixed(4),
      sell_average_price: +newSellAvg.toFixed(4),
      buy_value:          +newBuyVal.toFixed(2),
      sell_value:         +newSellVal.toFixed(2),
      current_price:      execPrice,
      realized_pnl:       +(+pos.realized_pnl + realizedPnL).toFixed(2),
      status:             netQty === 0 ? 'closed' : 'open',
      closed_at:          netQty === 0 ? new Date() : null,
    }, { transaction: t });
  }
};

// ═══════════════════════════════════════════
// CANCEL ORDER
// ═══════════════════════════════════════════
const cancelOrder = async (userId, orderId) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: orderId, user_id: userId },
      transaction: t,
    });

    if (!order) throw new Error('Order not found');

    if (!['open', 'pending'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    await order.update({
      status:       ORDER_STATUSES.CANCELLED,
      cancelled_at: new Date(),
    }, { transaction: t });

    // Release blocked funds (buy orders)
    if (order.transaction_type === 'buy') {
      const fund    = await Fund.findOne({ where: { user_id: userId }, transaction: t });
      const blocked = (order.price || 0) * order.pending_quantity + order.total_charges;

      await fund.update({
        available_balance: +fund.available_balance + blocked,
        blocked_amount:    Math.max(0, +fund.blocked_amount - blocked),
      }, { transaction: t });

      await FundTransaction.create({
        user_id:         userId,
        transaction_type:'order_released',
        amount:          blocked,
        credit_debit:    'credit',
        balance_after:   +fund.available_balance + blocked,
        description:     `Released blocked funds for cancelled order ${order.order_number}`,
        reference_type:  'order',
        reference_id:    order.id,
        status:          'completed',
      }, { transaction: t });
    }

    await t.commit();
    return order;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ═══════════════════════════════════════════
// MODIFY ORDER (pending/open limit orders)
// ═══════════════════════════════════════════
const modifyOrder = async (userId, orderId, updates) => {
  const order = await Order.findOne({ where: { id: orderId, user_id: userId } });
  if (!order)                            throw new Error('Order not found');
  if (!['open','pending'].includes(order.status)) {
    throw new Error(`Cannot modify order with status: ${order.status}`);
  }

  const allowed = ['quantity','price','trigger_price','validity','notes','tag'];
  const patch   = {};
  allowed.forEach((k) => { if (updates[k] !== undefined) patch[k] = updates[k]; });

  await order.update(patch);
  return order;
};

// ═══════════════════════════════════════════
// GET ORDERS
// ═══════════════════════════════════════════
const getUserOrders = async (userId, filters = {}) => {
  const where = { user_id: userId };

  if (filters.status)   where.status           = filters.status;
  if (filters.symbol)   where.symbol           = filters.symbol.toUpperCase();
  if (filters.side)     where.transaction_type = filters.side;
  if (filters.product)  where.product_type     = filters.product;

  if (filters.from_date || filters.to_date) {
    where.created_at = {};
    if (filters.from_date) where.created_at[Op.gte] = new Date(filters.from_date);
    if (filters.to_date)   where.created_at[Op.lte] = new Date(filters.to_date);
  }

  const page   = parseInt(filters.page,  10) || 1;
  const limit  = Math.min(parseInt(filters.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const { count, rows } = await Order.findAndCountAll({
    where,
    order:  [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    orders:     rows,
    pagination: {
      total:       count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
      has_next:    page * limit < count,
      has_prev:    page > 1,
    },
  };
};

export {
  placeOrder,
  cancelOrder,
  modifyOrder,
  getUserOrders,
  getStockPrice,
};

export default {
  placeOrder,
  cancelOrder,
  modifyOrder,
  getUserOrders,
  getStockPrice,
};