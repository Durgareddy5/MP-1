// apps/api/models/sql/Order.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Order = sequelize.define('orders', {
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
  
  // Order Identification
  order_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Human-readable order ID like ORD-20250330-001',
  },
  
  // Stock Details
  symbol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Stock symbol e.g. RELIANCE, TCS, INFY',
  },
  stock_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Full stock name e.g. Reliance Industries Ltd',
  },
  exchange: {
    type: DataTypes.ENUM('NSE', 'BSE'),
    allowNull: false,
    defaultValue: 'NSE',
  },
  isin: {
    type: DataTypes.STRING(12),
    allowNull: true,
    comment: 'International Securities Identification Number',
  },
  
  // Order Type
  order_type: {
    type: DataTypes.ENUM('market', 'limit', 'stop_loss', 'stop_limit'),
    allowNull: false,
    defaultValue: 'market',
  },
  transaction_type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false,
  },
  product_type: {
    type: DataTypes.ENUM(
      'CNC',      // Cash and Carry (Delivery)
      'MIS',      // Margin Intraday Settlement
      'NRML'      // Normal (F&O)
    ),
    allowNull: false,
    defaultValue: 'CNC',
  },
  
  // Quantity & Price
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  filled_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  pending_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Limit price or null for market orders',
  },
  trigger_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Trigger price for stop-loss orders',
  },
  average_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Average execution price',
  },
  
  // Execution Details
  executed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  total_value: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
    comment: 'Total order value = avg_price * filled_quantity',
  },
  
  // Charges (Paper trading simulated)
  brokerage: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  stt: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Securities Transaction Tax',
  },
  transaction_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  gst: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  stamp_duty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  total_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  
  // Order Status
  status: {
    type: DataTypes.ENUM(
      'pending',       // Waiting in queue
      'open',          // Sent to exchange (simulated)
      'partially_filled', // Partially executed
      'filled',        // Fully executed
      'cancelled',     // Cancelled by user
      'rejected',      // Rejected by system
      'expired'        // GTT/GTC order expired
    ),
    allowNull: false,
    defaultValue: 'pending',
  },
  
  // Validity
  validity: {
    type: DataTypes.ENUM('DAY', 'IOC', 'GTC', 'GTD'),
    defaultValue: 'DAY',
    comment: 'DAY=Day, IOC=Immediate or Cancel, GTC=Good Till Cancel, GTD=Good Till Date',
  },
  valid_till: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'For GTD orders',
  },
  
  // Rejection / Cancellation reason
  rejection_reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  
  // Tags / Notes
  tag: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'User-defined order tag',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  // Source tracking
  order_source: {
    type: DataTypes.ENUM('web', 'api', 'mobile', 'system'),
    defaultValue: 'web',
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'orders',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_number'], unique: true },
    { fields: ['symbol'] },
    { fields: ['status'] },
    { fields: ['transaction_type'] },
    { fields: ['created_at'] },
    { fields: ['user_id', 'status'] },
    { fields: ['user_id', 'symbol'] },
  ],
});

export default Order;