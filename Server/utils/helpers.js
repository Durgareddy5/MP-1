// ============================================
// Helper Utilities — Indian Market Specific
// ============================================
import { CHARGES, MARKET_TIMING } from './constants.js';

// ─── Order number generator ────────────────
const generateOrderNumber = () => {
  const d = new Date();
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0'),
  ].join('');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${date}-${rand}`;
};

const generateTradeNumber = () => {
  const d = new Date();
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0'),
  ].join('');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `TRD-${date}-${rand}`;
};

// ─── Market hours (IST) ────────────────────
const isMarketOpen = () => {
  const now  = new Date(new Date().toLocaleString('en-US', { timeZone:'Asia/Kolkata' }));
  const day  = now.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;

  const mins = now.getHours() * 60 + now.getMinutes();
  const open  = MARKET_TIMING.MARKET_OPEN.hour  * 60 + MARKET_TIMING.MARKET_OPEN.minute;
  const close = MARKET_TIMING.MARKET_CLOSE.hour * 60 + MARKET_TIMING.MARKET_CLOSE.minute;
  return mins >= open && mins <= close;
};

const getMarketStatus = () => {
  const now  = new Date(new Date().toLocaleString('en-US', { timeZone:'Asia/Kolkata' }));
  const day  = now.getDay();

  if (day === 0 || day === 6) {
    return { status:'closed', message:'Market Closed (Weekend)' };
  }

  const mins        = now.getHours() * 60 + now.getMinutes();
  const preOpenStart= MARKET_TIMING.PRE_OPEN_START.hour  * 60 + MARKET_TIMING.PRE_OPEN_START.minute;
  const marketOpen  = MARKET_TIMING.MARKET_OPEN.hour     * 60 + MARKET_TIMING.MARKET_OPEN.minute;
  const marketClose = MARKET_TIMING.MARKET_CLOSE.hour    * 60 + MARKET_TIMING.MARKET_CLOSE.minute;

  if (mins >= preOpenStart && mins < marketOpen)  return { status:'pre_open',  message:'Pre-Open Session' };
  if (mins >= marketOpen   && mins <= marketClose) return { status:'open',      message:'Market is Open' };
  if (mins >  marketClose  && mins <= 960)         return { status:'post_close',message:'Post-Close Session' };
  return { status:'closed', message:'Market is Closed' };
};

// ─── Brokerage charges calculator ──────────
// Simulates real Indian brokerage structure (Zerodha-style)
const calculateCharges = ({ transaction_type, product_type, quantity, price }) => {
  const turnover = quantity * price;
  let brokerage  = 0, stt = 0, exchangeTxn = 0, gst = 0, sebi = 0, stamp = 0;

  // Brokerage
  if (product_type === 'CNC') {
    brokerage = 0; // Free delivery
  } else {
    brokerage = Math.min(
      turnover * (CHARGES.BROKERAGE_INTRADAY_PERCENT / 100),
      CHARGES.BROKERAGE_MAX_INTRADAY
    );
  }

  // STT
  if (product_type === 'CNC') {
    stt = turnover * (CHARGES.STT_DELIVERY_BUY_PERCENT / 100);
  } else if (transaction_type === 'sell') {
    stt = turnover * (CHARGES.STT_INTRADAY_SELL_PERCENT / 100);
  }

  // Exchange transaction charges
  exchangeTxn = turnover * (CHARGES.EXCHANGE_TXN_PERCENT / 100);

  // GST on brokerage + exchange
  gst = (brokerage + exchangeTxn) * (CHARGES.GST_PERCENT / 100);

  // SEBI charges
  sebi = (turnover / 10000000) * CHARGES.SEBI_CHARGES_PER_CRORE;

  // Stamp duty (buy side only)
  if (transaction_type === 'buy') {
    stamp = turnover * (CHARGES.STAMP_DUTY_BUY_PERCENT / 100);
  }

  const total = brokerage + stt + exchangeTxn + gst + sebi + stamp;

  const r = (n) => Math.round(n * 100) / 100;

  return {
    brokerage:           r(brokerage),
    stt:                 r(stt),
    transaction_charges: r(exchangeTxn),
    gst:                 r(gst),
    sebi_charges:        r(sebi),
    stamp_duty:          r(stamp),
    total_charges:       r(total),
    turnover:            r(turnover),
    net_amount:          r(transaction_type === 'buy' ? turnover + total : turnover - total),
  };
};

// ─── Formatting ───────────────────────────
const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);

const parsePagination = (query) => {
  const page   = Math.max(1,   parseInt(query.page,  10) || 1);
  const limit  = Math.min(100, parseInt(query.limit, 10) || 20);
  return { page, limit, offset: (page - 1) * limit };
};

export {
  generateOrderNumber, generateTradeNumber,
  isMarketOpen, getMarketStatus,
  calculateCharges, formatINR, parsePagination,
};

export default {
  generateOrderNumber, generateTradeNumber,
  isMarketOpen, getMarketStatus,
  calculateCharges, formatINR, parsePagination,
};