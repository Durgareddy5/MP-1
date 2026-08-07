import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  Search, Bell, ChevronDown, LogOut, User,
  Settings as SettingsIcon, HelpCircle, Command,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import useAuthStore from '@/store/authStore';
import useMarketStore from '@/store/marketStore';
import { useNavigate } from 'react-router-dom';
import { TOPBAR_H } from './DashboardLayout';  // ← shared constant

// Sidebar widths — keep in sync with DashboardLayout / Sidebar
const SIDEBAR_EXPANDED_W  = 256; // 16rem / w-64
const SIDEBAR_COLLAPSED_W = 72;  // 4.5rem / w-[72px]

// Must match the sidebar's own collapse transition (duration + easing).
// Change here if you update the sidebar animation.
const SIDEBAR_TRANSITION = 'left 300ms cubic-bezier(0.4, 0, 0.2, 1)';

const Topbar = ({ sidebarCollapsed }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const marketStatus = useMarketStore((s) => s.marketStatus) || {};
  const [showSearch, setShowSearch]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef  = useRef(null);
  const profileRef = useRef(null);

  const ticks = useMarketStore((s) => s.ticks);




  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Ctrl/⌘K → open search  |  Escape → close overlays
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowProfile(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Explicit left + width — both driven by the same offset so the bar always
  // fills 100vw minus the sidebar, with no dependency on `right: 0` (which can
  // be overridden by Tailwind reset or a parent transform).
  const leftOffset = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  return (
    /*
      z-30 keeps the topbar above the ticker (z-20) and content,
      but below the sidebar (z-40) and the search modal (z-50).
      Height is set via the shared TOPBAR_H constant (64 px / h-16).

      Width is computed as `calc(100vw - leftOffset)` rather than relying on
      `right: 0`, because `right` can be defeated by a parent overflow or
      transform. Computing width explicitly guarantees the bar always stretches
      edge-to-edge regardless of what the sidebar does.
    */
    <header
      className={cn(
        'fixed top-0 z-30',
        'bg-[var(--bg-secondary)]/80 backdrop-blur-xl',
        'border-b border-[var(--border-primary)]',
        'flex items-center justify-between px-6',
      )}
      style={{
        height:     TOPBAR_H,
        left:       leftOffset,
        width:      `calc(100% - ${leftOffset}px)`,
        maxWidth:  "100%",
        right: "0px",
        margin: "0px",
        transition: SIDEBAR_TRANSITION,
      }}
    >
      {/* ─── Left: Search ─────────────────────────── */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setShowSearch(true)}
          className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-lg',
            'bg-[var(--bg-input)] border border-[var(--border-primary)]',
            'text-sm text-[var(--text-tertiary)]',
            'hover:border-[var(--border-secondary)] hover:text-[var(--text-secondary)]',
            'transition-all duration-200',
            'w-72 lg:w-96'
          )}
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search stocks, indices...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[10px] font-mono text-[var(--text-tertiary)] border border-[var(--border-primary)]">
            <Command size={10} />K
          </kbd>
        </button>
      </div>

      {/* ─── Right: Actions ───────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Market Status */}
        <div className={cn(
          'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]',
          'text-xs font-medium'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            marketStatus?.status === 'open'
            ? 'bg-[var(--profit)] pulse-dot'
            : marketStatus?.status === 'pre_open'
              ? 'bg-[var(--warning)] animate-pulse'
              : 'bg-[var(--text-tertiary)]'
          )} />
          <span className={cn(
            marketStatus?.status === 'open'
              ? 'text-[var(--profit)]'
              : 'text-[var(--text-secondary)]'
          )}>
            {marketStatus?.message || 'Market Closed'}
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--loss)] ring-2 ring-[var(--bg-secondary)]" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg',
              'hover:bg-[var(--bg-tertiary)] transition-all duration-200',
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0052FF] to-[#7C3AED] flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.first_name?.[0] || 'P'}{user?.last_name?.[0] || 'T'}
              </span>
            </div>
            <ChevronDown size={14} className={cn(
              'text-[var(--text-tertiary)] transition-transform duration-200',
              showProfile && 'rotate-180'
            )} />
          </button>

          {/*
            Dropdown — z-40 so it renders above the ticker (z-20)
            and page content, but still below the search modal (z-50).
          */}
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute right-0 top-full mt-2 w-64 z-40',
                  'bg-[var(--bg-card)] border border-[var(--border-primary)]',
                  'rounded-md shadow-[var(--shadow-lg)]',
                  'overflow-hidden'
                )}
                style={{ padding: '0.5rem' }}
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {user?.first_name || 'ProTrade'} {user?.last_name || 'User'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {user?.email || 'user@protrade.in'}
                  </p>
                  {user?.organization_name && (
                    <p className="text-xs text-[var(--accent-primary)] mt-1 font-medium">
                      {user.organization_name}
                    </p>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {[
                    { icon: User,         label: 'My Profile',    path: '/settings' },
                    { icon: SettingsIcon, label: 'Settings',      path: '/settings' },
                    { icon: HelpCircle,   label: 'Help & Support', path: '/help' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.path); setShowProfile(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-[var(--border-primary)] py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--loss)] hover:bg-[var(--loss-bg)] transition-all duration-200"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Search Modal ────────────────────────────
          z-50 puts it above everything (sidebar z-40, topbar z-30, ticker z-20).
          The backdrop uses isolation so backdrop-filter composites correctly
          even when .noise-overlay::after (z-9999) is above it in the DOM.
      ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-24 isolate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              className="relative w-full max-w-2xl mx-4"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 border-b border-[var(--border-primary)]">
                  <Search size={20} className="text-[var(--text-tertiary)]" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stocks, indices, sectors..."
                    className="w-full py-4 text-base bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[10px] font-mono text-[var(--text-tertiary)] border border-[var(--border-primary)]">
                    ESC
                  </kbd>
                </div>

                {/* Quick Results / Suggestions */}
                <div className="py-3 max-h-96 overflow-y-auto">
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                      Popular Stocks
                    </span>
                  </div>
                  {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'ITC'].map((stock) => (
                    <button
                      key={stock}
                      onClick={() => {
                        navigate(`/stock/${stock}`);
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary-light)] flex items-center justify-center">
                          <span className="text-xs font-bold text-[var(--accent-primary)]">
                            {stock[0]}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{stock}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">NSE</p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">EQUITY</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Topbar;
