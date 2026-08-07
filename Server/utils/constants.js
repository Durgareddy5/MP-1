// apps/api/utils/constants.js

// ═══════════════════════════════════════════════════════
// Indian Stock Market Constants
// ═══════════════════════════════════════════════════════

const EXCHANGES = {
  NSE: 'NSE',
  BSE: 'BSE',
};

const MARKET_INDICES = [
  { symbol: 'NIFTY_50', name: 'NIFTY 50', exchange: 'NSE' },
  { symbol: 'SENSEX', name: 'S&P BSE SENSEX', exchange: 'BSE' },
  { symbol: 'BANK_NIFTY', name: 'NIFTY Bank', exchange: 'NSE' },
  { symbol: 'NIFTY_IT', name: 'NIFTY IT', exchange: 'NSE' },
  { symbol: 'NIFTY_PHARMA', name: 'NIFTY Pharma', exchange: 'NSE' },
  { symbol: 'NIFTY_AUTO', name: 'NIFTY Auto', exchange: 'NSE' },
  { symbol: 'NIFTY_FMCG', name: 'NIFTY FMCG', exchange: 'NSE' },
  { symbol: 'NIFTY_METAL', name: 'NIFTY Metal', exchange: 'NSE' },
  { symbol: 'NIFTY_REALTY', name: 'NIFTY Realty', exchange: 'NSE' },
  { symbol: 'NIFTY_ENERGY', name: 'NIFTY Energy', exchange: 'NSE' },
  { symbol: 'NIFTY_INFRA', name: 'NIFTY Infra', exchange: 'NSE' },
  { symbol: 'NIFTY_PSU_BANK', name: 'NIFTY PSU Bank', exchange: 'NSE' },
  { symbol: 'NIFTY_MIDCAP_50', name: 'NIFTY Midcap 50', exchange: 'NSE' },
  { symbol: 'NIFTY_SMALLCAP_100', name: 'NIFTY Smallcap 100', exchange: 'NSE' },
  { symbol: 'NIFTY_NEXT_50', name: 'NIFTY Next 50', exchange: 'NSE' },
  { symbol: 'NIFTY_FIN_SERVICE', name: 'NIFTY Financial Services', exchange: 'NSE' },
  { symbol: 'NIFTY_MEDIA', name: 'NIFTY Media', exchange: 'NSE' },
  { symbol: 'NIFTY_PRIVATE_BANK', name: 'NIFTY Private Bank', exchange: 'NSE' },
  { symbol: 'INDIA_VIX', name: 'India VIX', exchange: 'NSE' },
];

// NIFTY 50 Constituent Stocks (as of 2025)
const NIFTY_50_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', isin: 'INE002A01018' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT', isin: 'INE467B01029' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', isin: 'INE040A01034' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', isin: 'INE009A01021' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', isin: 'INE090A01021' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', isin: 'INE030A01027' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', isin: 'INE154A01025' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', isin: 'INE062A01020' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', isin: 'INE397D01024' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', isin: 'INE237A01028' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', isin: 'INE018A01030' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT', isin: 'INE860A01027' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', isin: 'INE238A01034' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer Durables', isin: 'INE021A01026' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Auto', isin: 'INE585B01010' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharma', isin: 'INE044A01036' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Durables', isin: 'INE280A01028' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Finance', isin: 'INE296A01024' },
  { symbol: 'DMART', name: 'Avenue Supermarts Ltd', sector: 'Retail', isin: 'INE192R01011' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', isin: 'INE075A01022' },
  { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Ltd', sector: 'Energy', isin: 'INE213A01029' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power', isin: 'INE733E01010' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement', isin: 'INE481G01011' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', sector: 'Power', isin: 'INE752E01010' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Auto', isin: 'INE155A01022' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Auto', isin: 'INE101A01026' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metal', isin: 'INE081A01020' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Finance', isin: 'INE918I01026' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT', isin: 'INE669C01036' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd', sector: 'Insurance', isin: 'INE795G01014' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG', isin: 'INE239A01016' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking', isin: 'INE095A01012' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metal', isin: 'INE019A01038' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Conglomerate', isin: 'INE423A01024' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and SEZ Ltd', sector: 'Infrastructure', isin: 'INE742F01042' },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma', isin: 'INE059A01026' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining', isin: 'INE522F01014' },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd", sector: 'Pharma', isin: 'INE089A01023' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Auto', isin: 'INE066A01021' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Cement', isin: 'INE047A01021' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Auto', isin: 'INE158A01026' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metal', isin: 'INE038A01020' },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd", sector: 'Pharma', isin: 'INE361B01024' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', sector: 'FMCG', isin: 'INE216A01030' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd', sector: 'Insurance', isin: 'INE123W01016' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd', sector: 'Energy', isin: 'INE029A01011' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Auto', isin: 'INE917I01010' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd', sector: 'FMCG', isin: 'INE192A01025' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', sector: 'Healthcare', isin: 'INE437A01024' },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT', isin: 'INE214T01019' },
];

// Order Types
const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP_LOSS: 'stop_loss',
  STOP_LIMIT: 'stop_limit',
};

// Transaction Types
const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
};

// Product Types
const PRODUCT_TYPES = {
  CNC: 'CNC',     // Cash and Carry (Delivery)
  MIS: 'MIS',     // Margin Intraday Settlement
  NRML: 'NRML',   // Normal (F&O)
};

// Order Statuses
const ORDER_STATUSES = {
  PENDING: 'pending',
  OPEN: 'open',
  PARTIALLY_FILLED: 'partially_filled',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

// Charges structure (simulated like real Indian brokers)
const CHARGES = {
  BROKERAGE_DELIVERY_PERCENT: 0,       // Zerodha-style: ₹0 for delivery
  BROKERAGE_INTRADAY_PERCENT: 0.03,    // 0.03% or ₹20 per order (whichever is lower)
  BROKERAGE_MAX_INTRADAY: 20,          // Max ₹20 per order
  STT_DELIVERY_BUY_PERCENT: 0.1,       // 0.1% on buy side for delivery
  STT_DELIVERY_SELL_PERCENT: 0.1,      // 0.1% on sell side for delivery
  STT_INTRADAY_SELL_PERCENT: 0.025,    // 0.025% on sell side for intraday
  EXCHANGE_TXN_PERCENT: 0.00345,       // NSE transaction charges
  GST_PERCENT: 18,                     // 18% GST on brokerage + exchange charges
  SEBI_CHARGES_PER_CRORE: 10,          // ₹10 per crore
  STAMP_DUTY_BUY_PERCENT: 0.015,       // Stamp duty on buy side
};

// User Roles
const USER_ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

// Account Statuses
const ACCOUNT_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
  PENDING_VERIFICATION: 'pending_verification',
};

// Market Timing (IST)
const MARKET_TIMING = {
  PRE_OPEN_START: { hour: 9, minute: 0 },
  PRE_OPEN_END: { hour: 9, minute: 15 },
  MARKET_OPEN: { hour: 9, minute: 15 },
  MARKET_CLOSE: { hour: 15, minute: 30 },
  POST_CLOSE_END: { hour: 16, minute: 0 },
  TIMEZONE: 'Asia/Kolkata',
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Watchlist Limits
const WATCHLIST_LIMITS = {
  MAX_WATCHLISTS: 10,
  MAX_STOCKS_PER_WATCHLIST: 50,
};

export {
  EXCHANGES,
  MARKET_INDICES,
  NIFTY_50_STOCKS,
  ORDER_TYPES,
  TRANSACTION_TYPES,
  PRODUCT_TYPES,
  ORDER_STATUSES,
  CHARGES,
  USER_ROLES,
  ACCOUNT_STATUSES,
  MARKET_TIMING,
  PAGINATION,
  WATCHLIST_LIMITS,
};