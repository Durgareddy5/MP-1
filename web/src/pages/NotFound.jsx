import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, TrendingUp, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div data-theme="dark"
       className="min-h-screen bg-[var(--bg-primary)] flex items-center
                  justify-center px-6 relative overflow-hidden">
    {/* Glow */}
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[500px] h-[400px]
                    bg-[radial-gradient(ellipse,rgba(0,82,255,0.1),transparent_70%)]
                    pointer-events-none" />

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md relative z-10"
    >
      {/* 404 big text */}
      <div className="relative mb-6">
        <p className="text-[10rem] font-heading font-black leading-none
                      text-[var(--border-secondary)] select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <TrendingUp size={64} className="text-[var(--accent-primary)] opacity-30" />
        </div>
      </div>

      <h1 className="text-2xl font-heading font-bold
                     text-[var(--text-primary)] mb-3">
        Page Not Found
      </h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
        The market data you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link to="/dashboard">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                       text-white font-semibold text-sm
                       shadow-[0_0_25px_rgba(0,82,255,0.3)]"
          >
            <Home size={18} /> Back to Dashboard
          </motion.button>
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl
                     bg-[var(--bg-card)] border border-[var(--border-primary)]
                     text-[var(--text-secondary)] font-medium text-sm
                     hover:border-[var(--border-secondary)]
                     hover:text-[var(--text-primary)]
                     transition-all duration-200"
        >
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    </motion.div>
  </div>
);

export default NotFound;