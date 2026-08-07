// apps/api/models/sql/WatchlistItem.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const WatchlistItem = sequelize.define('watchlist_items', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  watchlist_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'watchlists',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  
  // Stock Details
  symbol: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  stock_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  exchange: {
    type: DataTypes.ENUM('NSE', 'BSE'),
    defaultValue: 'NSE',
  },
  
  // Alert Settings
  price_alert_high: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Alert when price goes above this',
  },
  price_alert_low: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Alert when price goes below this',
  },
  
  // Notes
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  
  // Sort Order within watchlist
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  
  // Added timestamp
  added_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'watchlist_items',
  indexes: [
    { fields: ['watchlist_id'] },
    { fields: ['user_id'] },
    { fields: ['symbol'] },
    { fields: ['watchlist_id', 'symbol', 'exchange'], unique: true }, // No duplicate stocks in same watchlist
  ],
});

export default WatchlistItem;