import api from './api';

const tradingService = {
  // Orders
  placeOrder: (data) => api.post('/orders', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  modifyOrder: (id, data) => api.put(`/orders/${id}`, data),

  // Holdings
  getHoldings: () => api.get('/portfolio/holdings'),

  // Positions
  getPositions: (params) => api.get('/portfolio/positions', { params }),
  squareOffPosition: (id) => api.post(`/portfolio/positions/${id}/squareoff`),
  squareOffAllPositions: () => api.post('/portfolio/positions/squareoff-all'),

  // Portfolio Summary
  getPortfolioSummary: () => api.get('/portfolio/summary'),

  // Analytics
  getAnalytics: (params) => api.get('/portfolio/analytics', { params }),
  getPortfolioTrend: (params) => api.get('/portfolio/trend', { params }),

  // Trade Logs
  getTradeLogs: (params) => api.get('/trades', { params }),

  // Funds
  getFunds: () => api.get('/funds'),
  addFunds: (amount) => api.post('/funds/deposit', { amount }),
  withdrawFunds: (amount) => api.post('/funds/withdraw', { amount }),
  getFundTransactions: (params) => api.get('/funds/transactions', { params }),

  // Watchlists
  getWatchlists: () => api.get('/watchlists'),
  createWatchlist: (data) => api.post('/watchlists', data),
  deleteWatchlist: (id) => api.delete(`/watchlists/${id}`),
  addToWatchlist: (watchlistId, data) => api.post(`/watchlists/${watchlistId}/items`, data),
  removeFromWatchlist: (watchlistId, itemId) => api.delete(`/watchlists/${watchlistId}/items/${itemId}`),

  // Market search + quotes
  searchStocks: (query, exchange) =>
    api.get('/market/search', { params: { q: query, ...(exchange ? { exchange } : {}) } }),

  getStockQuote: (symbol) => api.get(`/stocks/${encodeURIComponent(symbol)}/quote`),
  getStockDetails: (symbol) => api.get(`/stocks/${encodeURIComponent(symbol)}`),
  getStockHistory: (symbol, params) => api.get(`/market/${encodeURIComponent(symbol)}/history`, { params }),

  // Market snapshots
  getMarketIndices: () => api.get('/market/indices'),
  getMarketStatus: () => api.get('/market/status'),
  getTopGainers: (limit) => api.get('/market/top-gainers', { params: limit ? { limit } : {} }),
  getTopLosers: (limit) => api.get('/market/top-losers', { params: limit ? { limit } : {} }),
  getMostActive: (limit) => api.get('/market/most-active', { params: limit ? { limit } : {} }),

  // Instrument master helpers
  getInstrumentMasterStatus: () => api.get('/market/instrument-master/status'),
  refreshInstrumentMaster: () => api.post('/market/instrument-master/refresh'),

  // Alerts
  getAlerts: () => api.get('/alerts'),
  createAlert: (data) => api.post('/alerts', data),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
  toggleAlert: (id) => api.put(`/alerts/${id}/toggle`),

  // Settings
  updatePreferences: (data) => api.put('/settings/preferences', data),
};

export default tradingService;
