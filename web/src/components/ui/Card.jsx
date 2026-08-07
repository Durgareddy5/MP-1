import React from 'react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

const Card = React.forwardRef(({
  children,
  className,
  variant = 'default',
  hover = true,
  glow = false,
  animate = false,
  padding = true,
  onClick,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-[var(--bg-card)] border border-[var(--border-primary)]',
    elevated: 'bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-[var(--shadow-md)]',
    glass: 'glass',
    gradient: 'bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--border-primary)]',
    outlined: 'bg-transparent border border-[var(--border-secondary)]',
    ghost: 'bg-transparent',
  };

  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  } : {};

  return (
    <Component
      ref={ref}
      className={cn(
        'rounded-xl',
        'transition-all duration-200',
        variants[variant],
        hover && 'hover:border-[var(--border-secondary)] hover:bg-[var(--bg-card-hover)]',
        glow && 'card-glow glow-border',
        padding && 'p-4 sm:p-5',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

// Card Header Sub-component
export const CardHeader = ({ children, className, action }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>
    <div>{children}</div>
    {action && <div>{action}</div>}
  </div>
);

// Card Title
export const CardTitle = ({ children, className }) => (
  <h3 className={cn(
    'font-heading text-base font-semibold text-[var(--text-primary)]',
    className
  )}>
    {children}
  </h3>
);

// Card Description
export const CardDescription = ({ children, className }) => (
  <p className={cn('text-sm text-[var(--text-secondary)] mt-0.5', className)}>
    {children}
  </p>
);

export default Card;