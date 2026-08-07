// apps/api/models/sql/Watchlist.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Watchlist = sequelize.define('watchlists', {
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
  
  // Watchlist Info
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'My Watchlist',
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#0052FF',
    comment: 'Hex color for visual identification',
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'star',
  },
  
  // Ordering
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  
  // Status
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'watchlists',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'name'], unique: true },
  ],
});

export default Watchlist;