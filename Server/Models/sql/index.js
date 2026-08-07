// apps/api/models/sql/index.js

import User from './User.js';
import Fund from './Fund.js';
import FundTransaction from './FundTransaction.js';
import Order from './Order.js';
import Holding from './Holding.js';
import Position from './Position.js';
import Watchlist from './Watchlist.js';
import WatchlistItem from './WatchlistItem.js';
import TradeLog from './TradeLog.js';
import PriceAlert from './PriceAlert.js';
import PortfolioSnapshot from './PortfolioSnapshot.js';

// ═══════════════════════════════════════════════════════
// Define Associations (Relationships)
// ═══════════════════════════════════════════════════════

// User ↔ Fund (One-to-One)
User.hasOne(Fund, { foreignKey: 'user_id', as: 'fund' });
Fund.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ FundTransaction (One-to-Many)
User.hasMany(FundTransaction, { foreignKey: 'user_id', as: 'fundTransactions' });
FundTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Order (One-to-Many)
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Holding (One-to-Many)
User.hasMany(Holding, { foreignKey: 'user_id', as: 'holdings' });
Holding.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Position (One-to-Many)
User.hasMany(Position, { foreignKey: 'user_id', as: 'positions' });
Position.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Watchlist (One-to-Many)
User.hasMany(Watchlist, { foreignKey: 'user_id', as: 'watchlists' });
Watchlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Watchlist ↔ WatchlistItem (One-to-Many)
Watchlist.hasMany(WatchlistItem, { foreignKey: 'watchlist_id', as: 'items' });
WatchlistItem.belongsTo(Watchlist, { foreignKey: 'watchlist_id', as: 'watchlist' });

// User ↔ WatchlistItem (One-to-Many)
User.hasMany(WatchlistItem, { foreignKey: 'user_id', as: 'watchlistItems' });
WatchlistItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order ↔ TradeLog (One-to-Many - one order can have multiple partial fills)
Order.hasMany(TradeLog, { foreignKey: 'order_id', as: 'tradeLogs' });
TradeLog.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User ↔ TradeLog (One-to-Many)
User.hasMany(TradeLog, { foreignKey: 'user_id', as: 'tradeLogs' });
TradeLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ PriceAlert (One-to-Many)
User.hasMany(PriceAlert, { foreignKey: 'user_id', as: 'priceAlerts' });
PriceAlert.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ PortfolioSnapshot (One-to-Many)
User.hasMany(PortfolioSnapshot, { foreignKey: 'user_id', as: 'portfolioSnapshots' });
PortfolioSnapshot.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// FundTransaction ↔ Order (Optional relationship)
FundTransaction.belongsTo(Order, { foreignKey: 'reference_id', as: 'relatedOrder', constraints: false });

// ═══════════════════════════════════════════════════════

export {
  User,
  Fund,
  FundTransaction,
  Order,
  Holding,
  Position,
  Watchlist,
  WatchlistItem,
  TradeLog,
  PriceAlert,
  PortfolioSnapshot,
};