// apps/api/models/sql/Fund.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';
import env from '../../config/environment.js';

const Fund = sequelize.define('funds', {
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
    onUpdate: 'CASCADE',
  },
  
  // Balance Fields (all in INR, stored as DECIMAL for precision)
  available_balance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: env.DEFAULT_BALANCE, // ₹1 Crore default
    validate: {
      min: 0,
    },
  },
  used_margin: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
    },
  },
  total_balance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: env.DEFAULT_BALANCE,
  },
  blocked_amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Amount blocked for pending orders',
  },
  
  // P&L Tracking
  realized_pnl: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Total realized profit/loss',
  },
  unrealized_pnl: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Current unrealized profit/loss from open positions',
  },
  
  // Metadata
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  last_updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'funds',
  indexes: [
    { fields: ['user_id'], unique: true }, // One fund record per user
  ],
});

export default Fund;