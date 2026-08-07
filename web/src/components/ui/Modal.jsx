import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, children, title, subtitle, size = 'md', className }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className={cn(
              'relative w-full rounded-2xl',
              'bg-[var(--bg-card)] border border-[var(--border-primary)]',
              'shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)]',
              'overflow-hidden',
              sizes[size],
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
                <div>
                  {title && (
                    <h2 className="text-lg font-heading font-semibold text-[var(--text-primary)]">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;