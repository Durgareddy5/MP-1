import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Briefcase,
  Star, Wallet, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight, Activity, Bell, FileText, Shield,
   IndianRupee, PieChart, LineChart, Target, Zap,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import TrAIdeUrl from "@/assets/TrAIde_1.png";
import './Sidebar.css';

const navItems = [
  {
    section: 'MAIN',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/markets', label: 'Markets', icon: TrendingUp },
      { path: '/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    section: 'PORTFOLIO',
    items: [
      { path: '/portfolio', label: 'Holdings', icon: Briefcase },
      { path: '/positions', label: 'Positions', icon: Activity },
      { path: '/watchlist', label: 'Watchlist', icon: Star },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { path: '/funds', label: 'Funds', icon: Wallet },
      { path: '/trades', label: 'Trade Log', icon: FileText },
      { path: '/analytics', label: 'Analytics', icon: PieChart },
    ],
  },
  {
  section: "AI",
  items: [
    {
      path: "/ml-prediction",
      label: "AI Prediction",
      icon: Zap
    }
  ]
  },
  {
    section: 'SYSTEM',
    items: [
      { path: '/alerts', label: 'Price Alerts', icon: Bell },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]',
        'flex flex-col',
        'transition-all duration-300 ease-out',
        // FIX: overflow-x-hidden hides the brief flash of scrollbar that appears
        // on some browsers during the expand/collapse width animation.
        'overflow-x-hidden',
      )}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* ─── Logo Area ─────────────────── */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[var(--border-primary)] flex-shrink-0',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,82,255,0.3)]">
            <img 
              src={TrAIdeUrl} 
              alt="TrAIde"
              // FIX: Explicit width/height on the logo image to prevent layout shift
              // during load, which was causing the sidebar header to briefly resize.
              className="w-9 h-9 object-contain"
            />
          </div>
          {/* Live Market Indicator */}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--profit)] pulse-dot" />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden min-w-0"
            >
              <h1 className="text-lg font-heading font-bold gradient-text whitespace-nowrap">
                TrAIde
              </h1>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest -mt-0.5 whitespace-nowrap">
                Institutional
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Navigation ────────────────── */}
      {/*
        FIX: overflow-y-auto with scrollbar-gutter: stable prevents the nav
        area from shifting content when a scrollbar appears on small screens.
        overflow-x-hidden is needed because tooltips in collapsed mode extend
        beyond the sidebar boundary — they use position:absolute left-full,
        so we must NOT clip them here; clipping is handled by the sidebar's
        own overflow-x:hidden above (which only clips the width itself, not
        absolutely-positioned children that overflow via z-50).
        Correction: overflow-x-hidden on the nav would clip tooltips.
        We rely only on the motion.aside overflow-x-hidden during transition
        and allow the nav to overflow so tooltips remain visible.
      */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((section) => (
          <div key={section.section} className="mb-4">
            {/* Section Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)] whitespace-nowrap">
                    {section.section}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nav Items */}
            <div className="space-y-4">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg gapped',
                      'text-sm font-medium',
                      'transition-all duration-200',
                      'group',
                      collapsed && 'justify-center',
                      isActive
                        ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent-primary)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}

                    <Icon size={20} className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive && 'text-[var(--accent-primary)]'
                    )} />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed mode */}
                    {/* FIX: Changed z-50 → z-[60] so tooltips always render above
                        the topbar (z-30) and any cards/overlays in the content area.
                        Also added pointer-events-none so the tooltip itself never
                        steals mouse events from the nav link it labels. */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-xs font-medium text-[var(--text-primary)] shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] pointer-events-none">
                        {item.label}
                        {/* FIX: Added a small left-pointing caret for visual connection */}
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--border-primary)]" />
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── User Profile / Collapse ──── */}
      {/* FIX: flex-shrink-0 prevents this footer from being squished when the
          nav has many items on a short screen. */}
      <div className="border-t border-[var(--border-primary)] p-3 flex-shrink-0">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg mb-2',
            'text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-tertiary)] transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Profile */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          'bg-[var(--bg-tertiary)]',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0052FF] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.first_name?.[0] || 'P'}{user?.last_name?.[0] || 'T'}
            </span>
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {user?.first_name || 'ProTrade'} {user?.last_name || 'User'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                  {user?.email || 'user@protrade.in'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;