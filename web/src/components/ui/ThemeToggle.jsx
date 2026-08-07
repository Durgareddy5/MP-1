import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '@/store/themeStore';
import { cn } from '@/utils/cn';

const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative w-14 h-7 rounded-full p-0.5',
        'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]',
        'hover:border-[var(--border-secondary)]',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Sliding Circle */}
      <motion.div
        className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center',
          'shadow-md',
          isDark
            ? 'bg-[var(--accent-primary)]'
            : 'bg-amber-400'
        )}
        animate={{
          x: isDark ? 1 : 27,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon size={14} className="text-white" />
        ) : (
          <Sun size={14} className="text-white" />
        )}
      </motion.div>

      {/* Background Icons */}
      <div className="flex items-center justify-between px-1.5 h-full">
        <Moon size={12} className="text-[var(--text-tertiary)]" />
        <Sun size={12} className="text-[var(--text-tertiary)]" />
      </div>
    </button>
  );
};

export default ThemeToggle;