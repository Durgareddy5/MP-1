import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const PortfolioSnapshot = sequelize.define('portfolio_snapshot', {
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
  snapshot_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  equity_value: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  invested_value: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  pnl_value: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  underscored: true,
  tableName: 'portfolio_snapshots',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['snapshot_date'] },
    { fields: ['user_id', 'snapshot_date'], unique: true },
  ],
});

export default PortfolioSnapshot;
