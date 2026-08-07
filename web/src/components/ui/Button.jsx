import React from 'react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  // Primary Electric Blue
  primary: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white shadow-[0_0_20px_rgba(0,82,255,0.25)] hover:shadow-[0_0_30px_rgba(0,82,255,0.4)]',

  // Secondary / Outline
  secondary: 'bg-transparent border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] hover:text-[var(--accent-primary)]',

  // Ghost
  ghost: 'bg-transparent hover:bg-[var(--accent-primary-light)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]',

  // Danger
  danger: 'bg-[var(--loss)] hover:bg-red-700 text-white shadow-[0_0_20px_rgba(255,23,68,0.2)]',

  // Success / Buy
  success: 'bg-[var(--profit)] hover:brightness-110 text-[#09090b] font-semibold shadow-[0_0_20px_rgba(0,230,118,0.2)]',

  // Buy
  buy: 'bg-[#0052FF] hover:bg-[#0066FF] text-white font-semibold shadow-[0_0_20px_rgba(0,82,255,0.3)]',

  // Sell
  sell: 'bg-[#FF1744] hover:bg-[#FF3D5F] text-white font-semibold shadow-[0_0_20px_rgba(255,23,68,0.3)]',

  // Gradient
  gradient: 'bg-gradient-to-r from-[#0052FF] to-[#7C3AED] hover:from-[#0066FF] hover:to-[#8B5CF6] text-white shadow-[0_0_30px_rgba(0,82,255,0.3)]',

  // Glass
  glass: 'glass hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]',
};

const buttonSizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md gap-1',
  sm: 'px-3.5 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-7 py-3 text-base rounded-xl gap-2',
  xl: 'px-9 py-4 text-lg rounded-xl gap-2.5',
  icon: 'p-2.5 rounded-lg',
  'icon-sm': 'p-1.5 rounded-md',
};

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  animate = true,
  fullWidth = false,
  ...props
}, ref) => {
  const Component = animate ? motion.button : 'button';
  const animationProps = animate ? {
    whileHover: { scale: disabled || loading ? 1 : 1.02 },
    whileTap: { scale: disabled || loading ? 1 : 0.98 },
    transition: { duration: 0.15 },
  } : {};

  return (
    <Component
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        'select-none cursor-pointer',
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...animationProps}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
      ) : Icon ? (
        <Icon size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
      ) : null}

      {children && <span>{children}</span>}

      {IconRight && !loading && (
        <IconRight size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
      )}
    </Component>
  );
});

Button.displayName = 'Button';

export default Button;