// ============================================
// Application Constants
// ============================================

export default {
  // ─── User Roles ─────────────────────────────────────
  USER_ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    FUND_MANAGER: 'fund_manager',
    ANALYST: 'analyst',
    TRADER: 'trader',
    VIEWER: 'viewer',
  },

  // ─── Account Status ────────────────────────────────
  ACCOUNT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending_verification',
  },

  // ─── Order Types ───────────────────────────────────
  ORDER_TYPES: {
    MARKET: 'market',
    LIMIT: 'limit',
    STOP_LOSS: 'stop_loss',
    STOP_LOSS_LIMIT: 'stop_loss_limit',
  },

  // ─── Order Side ────────────────────────────────────
  ORDER_SIDE: {
    BUY: 'buy',
    SELL: 'sell',
  },

  // ─── Order Status ─────────────────────────────────
  ORDER_STATUS: {
    PENDING: 'pending',
    OPEN: 'open',
    PARTIALLY_FILLED: 'partially_filled',
    FILLED: 'filled',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  },

  // ─── Product Types (NSE/BSE specific) ─────────────
  PRODUCT_TYPES: {
    CNC: 'CNC',       // Cash and Carry (Delivery)
    MIS: 'MIS',       // Margin Intraday Square-off
    NRML: 'NRML',     // Normal (F&O overnight)
  },

  // ─── Exchanges ────────────────────────────────────
  EXCHANGES: {
    NSE: 'NSE',
    BSE: 'BSE',
  },

  // ─── Market Segments ──────────────────────────────
  SEGMENTS: {
    EQUITY: 'equity',
    FNO: 'fno',
    COMMODITY: 'commodity',
    CURRENCY: 'currency',
  },

  // ─── Indian Market Indices ────────────────────────
  MARKET_INDICES: {
    NIFTY_50: { symbol: '^NSEI', name: 'NIFTY 50', exchange: 'NSE' },
    SENSEX: { symbol: '^BSESN', name: 'SENSEX', exchange: 'BSE' },
    BANK_NIFTY: { symbol: '^NSEBANK', name: 'BANK NIFTY', exchange: 'NSE' },
    NIFTY_IT: { symbol: '^CNXIT', name: 'NIFTY IT', exchange: 'NSE' },
    NIFTY_PHARMA: { symbol: '^CNXPHARMA', name: 'NIFTY PHARMA', exchange: 'NSE' },
    NIFTY_AUTO: { symbol: '^CNXAUTO', name: 'NIFTY AUTO', exchange: 'NSE' },
    NIFTY_FINANCIAL: { symbol: 'NIFTY_FIN_SERVICE.NS', name: 'NIFTY FINANCIAL', exchange: 'NSE' },
    NIFTY_METAL: { symbol: '^CNXMETAL', name: 'NIFTY METAL', exchange: 'NSE' },
    NIFTY_REALTY: { symbol: '^CNXREALTY', name: 'NIFTY REALTY', exchange: 'NSE' },
    NIFTY_ENERGY: { symbol: '^CNXENERGY', name: 'NIFTY ENERGY', exchange: 'NSE' },
    NIFTY_INFRA: { symbol: '^CNXINFRA', name: 'NIFTY INFRA', exchange: 'NSE' },
    NIFTY_PSU_BANK: { symbol: 'NIFTYPSE.NS', name: 'NIFTY PSU BANK', exchange: 'NSE' },
    NIFTY_MIDCAP_50: { symbol: '^NSEMDCP50', name: 'NIFTY MIDCAP 50', exchange: 'NSE' },
    NIFTY_NEXT_50: { symbol: '^NSMIDCP', name: 'NIFTY NEXT 50', exchange: 'NSE' },
  },

  // ─── Indian Market Timing ────────────────────────
  MARKET_HOURS: {
    PRE_OPEN_START: '09:00',
    PRE_OPEN_END: '09:08',
    MARKET_OPEN: '09:15',
    MARKET_CLOSE: '15:30',
    POST_CLOSE_START: '15:40',
    POST_CLOSE_END: '16:00',
    TIMEZONE: 'Asia/Kolkata',
  },

  // ─── Transaction Types ────────────────────────────
  TRANSACTION_TYPES: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    BUY: 'buy',
    SELL: 'sell',
    DIVIDEND: 'dividend',
    CHARGE: 'charge',
    REFUND: 'refund',
  },

  // ─── Watchlist Limits ─────────────────────────────
  WATCHLIST_LIMITS: {
    MAX_WATCHLISTS: 10,
    MAX_STOCKS_PER_WATCHLIST: 50,
  },

  // ─── Pagination Defaults ──────────────────────────
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // ─── Brokerage / Charges (Paper Trading Simulation) 
  CHARGES: {
    BROKERAGE_PERCENTAGE: 0.03,       // 0.03% like discount brokers
    STT_DELIVERY_BUY: 0.1,            // 0.1% on buy side
    STT_DELIVERY_SELL: 0.1,           // 0.1% on sell side
    STT_INTRADAY_SELL: 0.025,         // 0.025% on sell side only
    EXCHANGE_TXN_CHARGE: 0.00345,     // NSE
    GST: 18,                          // 18% on brokerage + txn charges
    SEBI_CHARGE: 0.0001,              // ₹10 per crore
    STAMP_DUTY_BUY: 0.015,            // 0.015% on buy side
  },
};