// apps/api/models/sql/TradeLog.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const TradeLog = sequelize.define('trade_logs', {
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
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  
  // Trade Details
  trade_number: {
    type: DataTypes.STRING(25),
    allowNull: false,
    unique: true,
    comment: 'Unique trade ID like TRD-20250330-001',
  },
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
  
  // Transaction
  transaction_type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false,
  },
  product_type: {
    type: DataTypes.ENUM('CNC', 'MIS', 'NRML'),
    allowNull: false,
  },
  
  // Execution
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Execution price',
  },
  total_value: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  
  // Charges
  brokerage: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  total_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  net_value: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    comment: 'Total value after charges',
  },
  
  // Execution time
  executed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'trade_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_id'] },
    { fields: ['symbol'] },
    { fields: ['executed_at'] },
    { fields: ['trade_number'], unique: true },
  ],
});

export default TradeLog;