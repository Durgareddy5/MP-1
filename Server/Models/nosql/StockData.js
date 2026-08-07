// apps/api/models/nosql/StockData.js

import mongoose from 'mongoose';

const stockDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true,
    uppercase: true,
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
  isin: {
    type: String,
    index: true,
  },
  
  // Sector & Industry
  sector: { type: String },
  industry: { type: String },
  
  // Current Quote Data
  quote: {
    price: { type: Number },
    previous_close: { type: Number },
    open: { type: Number },
    high: { type: Number },
    low: { type: Number },
    close: { type: Number },
    change: { type: Number },
    change_percent: { type: Number },
    volume: { type: Number },
    avg_volume: { type: Number },
    
    // Bid-Ask
    bid_price: { type: Number },
    bid_quantity: { type: Number },
    ask_price: { type: Number },
    ask_quantity: { type: Number },
    
    // Circuit limits (specific to Indian markets)
    upper_circuit: { type: Number },
    lower_circuit: { type: Number },
    
    // 52 Week
    week_52_high: { type: Number },
    week_52_low: { type: Number },
    
    last_updated: { type: Date, default: Date.now },
  },
  
  // Company Info
  company_info: {
    market_cap: { type: Number },
    market_cap_category: {
      type: String,
      enum: ['large_cap', 'mid_cap', 'small_cap', 'micro_cap'],
    },
    pe_ratio: { type: Number },
    pb_ratio: { type: Number },
    dividend_yield: { type: Number },
    eps: { type: Number },
    book_value: { type: Number },
    face_value: { type: Number },
    lot_size: { type: Number, default: 1 },
  },
  
  // Index Membership
  indices: [{ type: String }], // e.g., ['NIFTY_50', 'NIFTY_IT']
  
  // Flags
  is_active: { type: Boolean, default: true },
  is_fno: { type: Boolean, default: false }, // Available in F&O
  is_index: { type: Boolean, default: false },
  
}, {
  timestamps: true,
  collection: 'stock_data',
});

// Compound indexes
stockDataSchema.index({ symbol: 1, exchange: 1 }, { unique: true });
stockDataSchema.index({ sector: 1 });
stockDataSchema.index({ 'company_info.market_cap_category': 1 });
stockDataSchema.index({ name: 'text', symbol: 'text' }); // Text search

const StockData =
  mongoose.models.StockData ||
  mongoose.model('StockData', stockDataSchema);

export default StockData;