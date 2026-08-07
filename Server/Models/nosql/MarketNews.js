// apps/api/models/nosql/MarketNews.js

import mongoose from 'mongoose';

const marketNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
  },
  content: {
    type: String,
  },
  source: {
    type: String,
    required: true,
  },
  source_url: {
    type: String,
  },
  image_url: {
    type: String,
  },
  
  // Categorization
  category: {
    type: String,
    enum: [
      'market_update', 'company_news', 'sector_update',
      'ipo', 'earnings', 'policy', 'global_markets',
      'commodities', 'forex', 'analysis', 'regulatory',
    ],
    default: 'market_update',
  },
  
  // Related Stocks
  related_symbols: [{ type: String }],
  related_sectors: [{ type: String }],
  
  // Sentiment (for future AI integration)
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral',
  },
  sentiment_score: {
    type: Number,
    min: -1,
    max: 1,
    default: 0,
  },
  
  // Tags
  tags: [{ type: String }],
  
  // Status
  is_breaking: { type: Boolean, default: false },
  is_featured: { type: Boolean, default: false },
  
  // Published
  published_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
}, {
  timestamps: true,
  collection: 'market_news',
});

// Indexes
marketNewsSchema.index({ published_at: -1 });
marketNewsSchema.index({ category: 1, published_at: -1 });
marketNewsSchema.index({ related_symbols: 1 });
marketNewsSchema.index({ title: 'text', summary: 'text' });


const MarketNews =
  mongoose.models.MarketNews ||
  mongoose.model('MarketNews', marketNewsSchema);

export default MarketNews;