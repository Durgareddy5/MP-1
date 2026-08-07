import { create } from 'zustand';

const useMarketStore = create((set) => ({
  ticks: [],
  ticksByKey: {},
  prices: {},
  depthByKey: {},
  candlesByKey: {},
  orderBooksByKey: {},

  marketStatus: {
    open: false,
    status: 'closed',
    message: 'Market Closed',
  },

  // 🔥 Normalize symbol → key
  getKey: (tick) => {
    if (!tick) return null;
    return (
      tick.key ||
      tick.symbol ||
      tick.displaySymbol ||
      null
    );
  },

  // ==========================
  // SINGLE TICK UPDATE
  // ==========================
  updateTick: (tick) => {
    if (!tick) return;

    const key = tick.key || tick.symbol || tick.displaySymbol;
    if (!key) return;

    set((state) => {
      const normalizedSymbol = String(tick.symbol || key)
        .replace('.NS', '')
        .replace('.BO', '');

      const timestamp = tick.timestamp || tick.time || Date.now();

      const nextTick = {
        ...tick,
        key,
        displaySymbol: tick.displaySymbol || normalizedSymbol,
        timestamp,
      };

      const ticksByKey = {
        ...state.ticksByKey,
        [key]: nextTick,
      };

      const prices = {
        ...state.prices,
        [key]: {
          symbol: tick.symbol || key,
          displaySymbol: nextTick.displaySymbol,
          price: tick.price ?? 0,
          change: tick.change ?? 0,
          changePercent: tick.changePercent ?? 0,
          timestamp,
        },
      };

      return {
        ticksByKey,
        prices,
        ticks: Object.values(ticksByKey),
      };
    });
  },

  // ==========================
  // DEPTH (kept for future)
  // ==========================
  updateDepth: (depth) => {
    if (!depth) return;

    const key =
      depth.key ||
      depth.symbol;

    if (!key) return;

    set((state) => ({
      depthByKey: {
        ...state.depthByKey,
        [key]: depth,
      },
    }));
  },

  updateOrderBook: (payload) => {
    const symbol = payload?.symbol;
    if (!symbol) return;

    set((state) => ({
      orderBooksByKey: {
        ...state.orderBooksByKey,
        [symbol]: {
          symbol,
          bids: Array.isArray(payload.bids) ? payload.bids : [],
          asks: Array.isArray(payload.asks) ? payload.asks : [],
          updatedAt: payload.updatedAt || Date.now(),
        },
      },
    }));
  },

  // ==========================
  // CANDLES
  // ==========================
  setCandlesForKey: (key, candles) => {
    if (!key) return;

    set((state) => ({
      candlesByKey: {
        ...state.candlesByKey,
        [key]: candles,
      },
    }));
  },

  // ==========================
  // MARKET STATUS
  // ==========================
  setMarketStatus: (statusObj) => {
    set({
      marketStatus: {
        open: Boolean(statusObj?.connected),
        status: statusObj?.status || 'closed',
        message: statusObj?.message || 'Market Closed',
        ...statusObj,
      },
    });
  },

  // ==========================
  // RESET
  // ==========================
  resetMarketData: () => {
    set({
      ticks: [],
      ticksByKey: {},
      prices: {},
      depthByKey: {},
      candlesByKey: {},
      marketStatus: {
        open: false,
        status: 'closed',
        message: 'Market Closed',
      },
    });
  },
}));

export default useMarketStore;