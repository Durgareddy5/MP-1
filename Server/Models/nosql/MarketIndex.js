// apps/api/models/nosql/MarketIndex.js

import mongoose from 'mongoose';

const marketIndexSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true,
    enum: [
      'NIFTY_50', 'SENSEX', 'BANK_NIFTY', 'NIFTY_IT',
      'NIFTY_PHARMA', 'NIFTY_AUTO', 'NIFTY_FMCG', 'NIFTY_METAL',
      'NIFTY_REALTY', 'NIFTY_ENERGY', 'NIFTY_INFRA', 'NIFTY_PSU_BANK',
      'NIFTY_MIDCAP_50', 'NIFTY_SMALLCAP_100', 'NIFTY_NEXT_50',
      'NIFTY_FIN_SERVICE', 'NIFTY_MEDIA', 'NIFTY_PRIVATE_BANK',
      'NIFTY_COMMODITIES', 'INDIA_VIX',
    ],
  },
  name: {
    type: String,
    required: true,
  },
  exchange: {
    type: String,
    enum: ['NSE', 'BSE'],
    required: true,
  },
  
  // Current Data
  current_value: { type: Number, required: true },
  previous_close: { type: Number },
  open: { type: Number },
  high: { type: Number },
  low: { type: Number },
  change: { type: Number },
  change_percent: { type: Number },
  
  // Volume
  volume: { type: Number },
  
  // 52 Week
  week_52_high: { type: Number },
  week_52_low: { type: Number },
  
  // Top Gainers/Losers in this index
  top_gainers: [{
    symbol: String,
    name: String,
    price: Number,
    change_percent: Number,
  }],
  top_losers: [{
    symbol: String,
    name: String,
    price: Number,
    change_percent: Number,
  }],
  
  // Market Status
  market_status: {
    type: String,
    enum: ['pre_open', 'open', 'closed', 'holiday'],
    default: 'closed',
  },
  
  // Timestamp
  last_updated: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
}, {
  timestamps: true,
  collection: 'market_indices',
});



// Compound index for efficient queries
marketIndexSchema.index({ symbol: 1, last_updated: -1 });

const MarketIndex =
  mongoose.models.MarketIndex ||
  mongoose.model('MarketIndex', marketIndexSchema);

export default MarketIndex;