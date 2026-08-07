import React from 'react';
import { cn } from '@/utils/cn';

const badgeVariants = {
  default: 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
  profit: 'bg-[var(--profit-bg)] text-[var(--profit)] border-[var(--profit-border)]',
  loss: 'bg-[var(--loss-bg)] text-[var(--loss)] border-[var(--loss-border)]',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  neutral: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)]',
  // Order statuses
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  filled: 'bg-[var(--profit-bg)] text-[var(--profit)] border-[var(--profit-border)]',
  cancelled: 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-primary)]',
  rejected: 'bg-[var(--loss-bg)] text-[var(--loss)] border-[var(--loss-border)]',
  // Product types
  CNC: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  MIS: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  NRML: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  // Exchanges
  NSE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  BSE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const badgeSizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-md border',
        'font-mono tracking-wide uppercase',
        badgeVariants[variant] || badgeVariants.default,
        badgeSizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'profit' && 'bg-[var(--profit)]',
            variant === 'loss' && 'bg-[var(--loss)]',
            variant === 'pending' && 'bg-amber-400',
            variant === 'open' && 'bg-blue-400',
            variant === 'filled' && 'bg-[var(--profit)]',
            variant === 'default' && 'bg-[var(--accent-primary)]',
          )}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;