import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useThemeStore from '@/store/themeStore';
import useAuthStore from '@/store/authStore';
import MLPrediction from "./pages/MLPrediction";

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout';

// Public Pages
import Landing   from '@/pages/Landing';
import Login     from '@/pages/Login';
import Register  from '@/pages/Register';
import NotFound  from '@/pages/NotFound';

// Protected Pages
import Dashboard  from '@/pages/Dashboard';
import Markets    from '@/pages/Markets';
import StockDetail from '@/pages/StockDetail';
import Orders     from '@/pages/Orders';
import Portfolio  from '@/pages/Portfolio';
import Positions  from '@/pages/Positions';
import Watchlist  from '@/pages/Watchlist';
import Funds      from '@/pages/Funds';
import Analytics  from '@/pages/Analytics';
import Settings   from '@/pages/Settings';
import Trades from '@/pages/Trades'; 
import PriceAlerts from '@/pages/PriceAlerts';
import useLiveMarketData from '@/hooks/useLiveMarketData';

// Auth Guard
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public-only Guard (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const App = () => {
  useLiveMarketData();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* ── Protected Routes (inside dashboard shell) ── */}
        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/markets"    element={<Markets />} />
          <Route path="/stock/:symbol" element={<StockDetail />} />
          <Route path="/orders"     element={<Orders />} />
          <Route path="/portfolio"  element={<Portfolio />} />
          <Route path="/positions"  element={<Positions />} />
          <Route path="/watchlist"  element={<Watchlist />} />
          <Route path="/funds"      element={<Funds />} />
          <Route path="/analytics"  element={<Analytics />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/alerts" element={<PriceAlerts />} />
          <Route path="/ml-prediction" element={<MLPrediction />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: { iconTheme: { primary: 'var(--profit)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'var(--loss)',   secondary: '#fff' } },
        }}
      />
    </>
  );
};

export default App;