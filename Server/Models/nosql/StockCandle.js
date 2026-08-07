// apps/api/models/nosql/StockCandle.js

import mongoose from 'mongoose';

const stockCandleSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true,
    uppercase: true,
  },
  exchange: {
    type: String,
    enum: ['NSE', 'BSE'],
    required: true,
  },
  
  // Interval type
  interval: {
    type: String,
    required: true,
    enum: ['1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M'],
    index: true,
  },
  
  // OHLCV Data
  timestamp: {
    type: Date,
    required: true,
  },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true },
  
  // Additional
  vwap: { type: Number }, // Volume Weighted Average Price
  trades: { type: Number }, // Number of trades
  
}, {
  timestamps: true,
  collection: 'stock_candles',
});

// Compound unique index to prevent duplicates
stockCandleSchema.index(
  { symbol: 1, exchange: 1, interval: 1, timestamp: 1 },
  { unique: true }
);

// TTL index for auto-cleanup of old intraday data (keep 90 days of 1m data)
stockCandleSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    partialFilterExpression: { interval: '1m' },
  }
);

const StockCandle =
  mongoose.models.StockCandle ||
  mongoose.model('StockCandle', stockCandleSchema);

export default StockCandle;

