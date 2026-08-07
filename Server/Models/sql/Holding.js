// apps/api/models/sql/Holding.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Holding = sequelize.define('holdings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
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
    allowNull: false,
    defaultValue: 'NSE',
  },
  isin: {
    type: DataTypes.STRING(12),
    allowNull: true,
  },
  
  // Quantity & Pricing
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  average_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Average buy price per share',
  },
  total_invested: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    comment: 'Total amount invested = quantity * average_price',
  },
  
  // Current Market Data (updated periodically)
  current_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Latest market price',
  },
  current_value: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    comment: 'Current market value = quantity * current_price',
  },
  
  // P&L
  pnl: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    comment: 'Unrealized P&L = current_value - total_invested',
  },
  pnl_percentage: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Percentage P&L',
  },
  day_change: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: "Today's change in value",
  },
  day_change_percentage: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0.00,
  },
  
  // First and Last trade dates
  first_bought_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_traded_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  // Sector classification
  sector: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'holdings',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['symbol'] },
    { fields: ['user_id', 'symbol', 'exchange'], unique: true }, // One holding per stock per exchange per user
  ],
});

export default Holding;