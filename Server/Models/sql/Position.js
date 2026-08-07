// apps/api/models/sql/Position.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Position = sequelize.define('positions', {
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
  
  // Position Details
  product_type: {
    type: DataTypes.ENUM('MIS', 'NRML'),
    allowNull: false,
    defaultValue: 'MIS',
  },
  position_type: {
    type: DataTypes.ENUM('long', 'short'),
    allowNull: false,
  },
  
  // Quantities
  buy_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  sell_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  net_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'buy_quantity - sell_quantity',
  },
  
  // Prices
  buy_average_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  sell_average_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  current_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  
  // Values
  buy_value: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  sell_value: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  
  // P&L
  realized_pnl: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  unrealized_pnl: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  total_pnl: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  
  // Status
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
  },
  
  // Timestamps
  opened_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'positions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['symbol'] },
    { fields: ['status'] },
    { fields: ['user_id', 'symbol', 'status'] },
  ],
});

export default Position;