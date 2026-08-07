// apps/api/models/sql/PriceAlert.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';


const PriceAlert = sequelize.define('price_alerts', {
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
  
  // Stock
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
  
  // Alert Condition
  condition: {
    type: DataTypes.ENUM(
      'price_above',
      'price_below',
      'change_percent_above',
      'change_percent_below',
      'volume_above'
    ),
    allowNull: false,
  },
  target_value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  
  // Status
  is_triggered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  triggered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  triggered_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  
  // Notification
  notification_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  
  // Optional notes
  notes: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'price_alerts',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['symbol'] },
    { fields: ['is_active', 'is_triggered'] },
  ],
});

export default PriceAlert;