import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StockTicker from '@/components/ui/StockTicker';
import useAuthStore from '@/store/authStore';
import useThemeStore from '@/store/themeStore';

// Shared layout constants — single source of truth for all offset math
export const TOPBAR_H   = 64;  // px  (h-16 = 4rem)
export const TICKER_H   = 36;  // px  — real rendered height of StockTicker
export const HEADER_H   = TOPBAR_H + TICKER_H;  // 100px total fixed header

const DashboardLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const sidebarW = sidebarCollapsed ? 72 : 256;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] noise-overlay">
      {/* ── Sidebar (z-40) ─────────────────────────────── */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* ── Main area shifts right of sidebar ──────────── */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarW }}
      >
        {/* ── Topbar (z-30, h=64px) ──────────────────── */}
        <Topbar sidebarCollapsed={sidebarCollapsed} />

        {/*
          ── StockTicker (z-20, fixed below topbar) ─────
          • top: TOPBAR_H     → sits flush under the topbar
          • height: TICKER_H  → explicit so <main> can use the same value
          • z-20 < z-30 (topbar) so the topbar's bottom border always wins
        */}
        <div
          className="fixed z-20 right-0 transition-all duration-300"
          style={{
            top:    54,
            left:   sidebarW,
            height: TICKER_H,
            width:      `calc(100% - ${sidebarW}px)`,
            maxWidth:  "100%",
            right: "0px",
            margin: "0px",
          }}
        >
          <StockTicker />
        </div>

        {/*
          ── Page Content ───────────────────────────────
          paddingTop = topbar (64) + ticker (36) = 100px
          Using a CSS custom property keeps it DRY and avoids
          arbitrary Tailwind values that are easy to mis-type.
        */}
        <main
          className="pb-8 px-6 min-h-screen"
          style={{ paddingTop: HEADER_H,paddingLeft: 10, paddingRight: 10,paddingBottom: 20 }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;