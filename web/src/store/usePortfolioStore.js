import { create } from 'zustand';

const usePortfolioStore = create((set) => ({
  // Holdings
  holdings: [],
  holdingsLoading: true,
  holdingsSummary: {
    total_invested: 0,
    current_value: 0,
    total_pnl: 0,
    total_pnl_percentage: 0,
    day_change: 0,
  },

  // Positions
  positions: [],
  positionsLoading: true,

  // Funds
  funds: null,
  fundsLoading: true,

  // Orders
  orders: [],
  ordersLoading: true,

  // Actions
  setHoldings: (holdings) => set({ holdings, holdingsLoading: false }),
  setHoldingsSummary: (summary) => set({ holdingsSummary: summary }),
  setPositions: (positions) => set({ positions, positionsLoading: false }),
  setFunds: (funds) => set({ funds, fundsLoading: false }),
  setOrders: (orders) => set({ orders, ordersLoading: false }),

  updateHolding: (symbol, data) =>
    set((state) => ({
      holdings: state.holdings.map((h) =>
        h.symbol === symbol ? { ...h, ...data } : h
      ),
    })),
}));

export default usePortfolioStore;