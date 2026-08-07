// apps/api/models/sql/User.js

import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  
  // Personal Information
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50],
      notEmpty: true,
    },
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50],
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email address already in use.',
    },
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [8, 255],
    },
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      is: /^[+]?[\d\s-]{10,15}$/i,
    },
  },
  
  // MNC / Organization Details
  organization_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  organization_type: {
    type: DataTypes.ENUM(
      'private_limited',
      'public_limited',
      'llp',
      'partnership',
      'proprietorship',
      'huf',
      'trust',
      'other'
    ),
    allowNull: true,
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  employee_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  
  // KYC & Verification
  pan_number: {
    type: DataTypes.STRING(10),
    allowNull: true,
    unique: true,
    validate: {
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
    },
  },
  gstin: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  cin_number: {
    type: DataTypes.STRING(21),
    allowNull: true,
  },
  kyc_status: {
    type: DataTypes.ENUM('pending', 'submitted', 'verified', 'rejected'),
    defaultValue: 'pending',
  },
  
  // Account Settings
  role: {
    type: DataTypes.ENUM('user', 'manager', 'admin', 'super_admin'),
    defaultValue: 'user',
  },
  account_status: {
    type: DataTypes.ENUM('active', 'suspended', 'deactivated', 'pending_verification'),
    defaultValue: 'active',
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  
  // Preferences
  theme_preference: {
    type: DataTypes.ENUM('dark', 'light'),
    defaultValue: 'dark',
  },
  default_exchange: {
    type: DataTypes.ENUM('NSE', 'BSE'),
    defaultValue: 'NSE',
  },
  notification_preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      email_alerts: true,
      order_updates: true,
      price_alerts: true,
      market_news: true,
    },
  },
  
  // Security
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  password_changed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refresh_token: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  
  // Avatar / Profile
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  
}, {
  timestamps: true,
  underscored: true,
  tableName: 'users',
  indexes: [
    { fields: ['pan_number'] },
    { fields: ['organization_name'] },
    { fields: ['account_status'] },
    { fields: ['role'] },
  ],
  hooks: {
    // Hash password before saving
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
        user.password_changed_at = new Date();
      }
    },
  },
});

// Instance method - Compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method - Check if account is locked
User.prototype.isLocked = function () {
  if (this.locked_until && this.locked_until > new Date()) {
    return true;
  }
  return false;
};

// Instance method - Check if password changed after JWT issued
User.prototype.changedPasswordAfter = function (JWTTimestamp) {
  if (this.password_changed_at) {
    const changedTimestamp = parseInt(
      this.password_changed_at.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// Instance method - Get safe user object (no password)
User.prototype.toSafeObject = function () {
  const values = this.toJSON();
  delete values.password;
  delete values.refresh_token;
  delete values.login_attempts;
  delete values.locked_until;
  return values;
};

export default User;