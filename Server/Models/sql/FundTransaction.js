// apps/api/models/sql/FundTransaction.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const FundTransaction = sequelize.define('fund_transactions', {
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
  
  // Transaction Details
  transaction_type: {
    type: DataTypes.ENUM(
      'deposit',          // Add virtual funds
      'withdrawal',       // Remove virtual funds
      'buy_debit',        // Deducted when buying stocks
      'sell_credit',      // Credited when selling stocks
      'order_blocked',    // Amount blocked for pending limit/stop orders
      'order_released',   // Amount released when order is cancelled
      'dividend_credit',  // Dividend received
      'brokerage_debit',  // Brokerage/commission charges
      'tax_debit',        // STT, GST, etc.
      'initial_credit',   // Initial balance on signup
      'adjustment',       // Manual adjustment by admin
    ),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  
  // Direction
  credit_debit: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false,
  },
  
  // Balance after this transaction
  balance_after: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  
  // Reference
  reference_type: {
    type: DataTypes.ENUM('order', 'manual', 'system', 'dividend', 'charges'),
    defaultValue: 'manual',
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Order ID or other reference',
  },
  
  // Description
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  
  // Status
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'failed', 'reversed'),
    defaultValue: 'completed',
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'fund_transactions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['transaction_type'] },
    { fields: ['created_at'] },
    { fields: ['reference_id'] },
  ],
});

export default FundTransaction;