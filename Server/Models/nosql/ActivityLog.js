// apps/api/models/nosql/ActivityLog.js

import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  
  // Activity Details
  action: {
    type: String,
    required: true,
    enum: [
      // Auth
      'login', 'logout', 'register', 'password_change', 'password_reset',
      'token_refresh', 'login_failed',
      
      // Trading
      'order_placed', 'order_cancelled', 'order_modified', 'order_executed',
      'order_rejected',
      
      // Portfolio
      'holding_updated', 'position_opened', 'position_closed',
      'position_squared_off',
      
      // Watchlist
      'watchlist_created', 'watchlist_deleted', 'watchlist_item_added',
      'watchlist_item_removed',
      'stock_added_to_watchlist',
      'stock_removed_from_watchlist',
      
      // Funds
      'fund_deposited', 'fund_withdrawn',
      
      // Alerts
      'alert_created', 'alert_triggered', 'alert_deleted',
      
      // Profile
      'profile_updated', 'settings_changed', 'theme_changed',
      
      // System
      'session_expired', 'account_locked', 'account_unlocked',
    ],
    index: true,
  },
  
  // Category
  category: {
    type: String,
    enum: ['auth', 'trading', 'portfolio', 'watchlist', 'funds', 'alerts', 'profile', 'system'],
    required: true,
    index: true,
  },
  
  // Details
  description: { type: String },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Request Info
  ip_address: { type: String },
  user_agent: { type: String },
  request_method: { type: String },
  request_path: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
  },
  
  // Error info (if applicable)
  error_message: { type: String },
  
}, {
  timestamps: true,
  collection: 'activity_logs',
});

// Indexes
activityLogSchema.index({ created_at: -1 });
activityLogSchema.index({ user_id: 1, action: 1 });
activityLogSchema.index({ user_id: 1, created_at: -1 });

// TTL index - auto-delete logs older than 1 year
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;

