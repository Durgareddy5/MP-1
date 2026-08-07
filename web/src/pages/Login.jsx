import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import authService   from '../services/authService';
import toast         from 'react-hot-toast';
import {
  Mail, Lock, Zap, Eye, EyeOff,
  TrendingUp, BarChart3, Shield,
  ArrowRight, Loader2
} from 'lucide-react';

import TrAIdeUrl from "@/assets/TrAIde_1.png";
import './Login.css';


/* ─── tiny animated stat pill ──────────────────── */
const StatPill = ({ icon: Icon, label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 px-3 py-1.5 rounded-full
               bg-white/5 border border-white/10 backdrop-blur-sm"
  >
    <Icon size={14} className="text-[var(--accent-primary)]" />
    <span className="text-xs text-white/60">{label}</span>
    <span className="text-xs font-semibold text-white">{value}</span>
  </motion.div>
);

const Login = () => {
  const navigate        = useNavigate();
  const { setAuth }     = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
  setLoading(true);
  try {
    const res = await authService.login(data);

    const { user, access_token } = res.data;

    setAuth(user, access_token);

    toast.success(`Welcome back, ${user.first_name}!`);
    navigate('/dashboard');

  } catch (err) {
    toast.error(
      err.message || 'Login failed. Please check your credentials.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      data-theme="dark"
      className="min-h-screen flex bg-[var(--bg-primary)] overflow-hidden"
    >
      {/* ══════════ LEFT PANEL — Branding ══════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col
                      items-center justify-center p-12 overflow-hidden">
        {/* Mesh background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br
                          from-[#0052FF]/20 via-[#7C3AED]/10 to-transparent" />
          <div className="absolute inset-0 bg-[var(--bg-primary)]
                          opacity-60" />
          {/* Grid lines */}
          <div className="absolute inset-0"
               style={{
                 backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px,
                                   transparent 1px),
                                   linear-gradient(90deg,
                                   rgba(255,255,255,0.02) 1px, transparent 1px)`,
                 backgroundSize: '60px 60px',
               }}
          />
        </div>

        {/* Glow orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full
                     bg-[#0052FF] blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full
                     bg-[#7C3AED] blur-[100px] pointer-events-none"
        />

        {/* Content */}
        <div className="relative z-10 max-w-md w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-11 h-11 rounded-xl flex items-center
                            justify-center shadow-[0_0_30px_rgba(0,82,255,0.4)]">
              <img 
                src={TrAIdeUrl} 
                alt="TrAIde"
              />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">
                TrAIde
              </h1>
              <p className="text-xs text-white/40 uppercase tracking-widest -mt-0.5">
                Institutional
              </p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-4xl font-heading font-bold text-white
                           leading-tight mb-4">
              India's Premier
              <br />
              <span className="bg-gradient-to-r from-[#0052FF] to-[#00E676]
                               bg-clip-text text-transparent">
                Institutional
              </span>
              <br />
              Trading Platform
            </h2>
            <p className="text-white/50 text-base leading-relaxed">
              Real-time NSE & BSE data, AI-powered insights, and
              institutional-grade risk management — all in one platform.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="flex flex-wrap gap-2 mb-10 aligned_2">
            <StatPill icon={TrendingUp}  label="Indices"    value="19+"    delay={0.2} />
            <StatPill icon={BarChart3}   label="Stocks"     value="5000+"  delay={0.3} />
            <StatPill icon={Shield}      label="Security"   value="Bank-Grade" delay={0.4} />
          </div>

          {/* Animated mini chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white/5 border border-white/10
                       backdrop-blur-sm p-5 overflow-hidden rounding"
          >
            <div className="flex items-center justify-between mb-3 aligned">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">NIFTY 50</p>
                <p className="text-xl font-mono font-bold text-white">23,519.35</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#00E676]/10
                               text-[#00E676] text-sm font-mono font-semibold
                               border border-[#00E676]/20">
                +0.61%
              </span>
            </div>
            <svg viewBox="0 0 300 80" className="w-full">
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#0052FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,65 Q30,60 50,50 T100,38 Q130,45 150,30
                   T200,22 Q230,18 260,12 L300,8 L300,80 L0,80 Z"
                fill="url(#lg)"
              />
              <path
                d="M0,65 Q30,60 50,50 T100,38 Q130,45 150,30
                   T200,22 Q230,18 260,12 L300,8"
                fill="none" stroke="#0052FF" strokeWidth="2"
              />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL — Login Form ══════════ */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-6 lg:py-12 bg-[var(--bg-secondary)]">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br
                            from-[#0052FF] to-[#7C3AED] flex items-center
                            justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-heading font-bold
                             text-[var(--text-primary)]">ProTrade</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold
                           text-[var(--text-primary)] mb-2">
              Welcome back
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              Sign in to your institutional trading account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium
                                text-[var(--text-secondary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18}
                  className="absolute left-2 top-1/2 -translate-y-1/2
                             text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl
                             bg-[var(--bg-input)] border border-[var(--border-primary)]
                             text-[var(--text-primary)] text-sm
                             placeholder:text-[var(--text-tertiary)]
                             focus:outline-none focus:border-[var(--accent-primary)]
                             focus:ring-2 focus:ring-[var(--accent-primary)]/20
                             transition-all duration-200 adjusted"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--loss)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <button type="button"
                  className="text-xs text-[var(--accent-primary)]
                             hover:underline transition-all">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={18}
                  className="absolute left-2 top-1/2 -translate-y-1/2
                             text-[var(--text-tertiary)]" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                  })}
                  className="w-full pl-10 pr-12 py-3 rounded-xl
                             bg-[var(--bg-input)] border border-[var(--border-primary)]
                             text-[var(--text-primary)] text-sm
                             placeholder:text-[var(--text-tertiary)]
                             focus:outline-none focus:border-[var(--accent-primary)]
                             focus:ring-2 focus:ring-[var(--accent-primary)]/20
                             transition-all duration-200 adjusted"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                             text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
                             transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[var(--loss)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2
                         py-3 rounded-xl font-semibold text-sm text-white
                         bg-gradient-to-r from-[#0052FF] to-[#7C3AED]
                         hover:from-[#0066FF] hover:to-[#8B5CF6]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         shadow-[0_0_30px_rgba(0,82,255,0.3)]
                         hover:shadow-[0_0_40px_rgba(0,82,255,0.5)]
                         transition-all duration-300"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                : <><span>Sign In</span><ArrowRight size={18} /></>
              }
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 py-12">
            <div className="flex-1 h-px bg-[var(--border-primary)]" />
            <span className="text-xs text-[var(--text-tertiary)]">OR</span>
            <div className="flex-1 h-px bg-[var(--border-primary)]" />
          </div>

          {/* Demo account notice */}
          <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5
                          border border-[var(--accent-primary)]/20 mb-6">
            <p className="text-xs text-[var(--text-secondary)] text-center">
              🎯 New here?{' '}
              <span className="text-[var(--accent-primary)] font-medium">
                Register to get ₹1 Crore virtual funds
              </span>{' '}
              for paper trading
            </p>
          </div>

          {/* Register link */}
          <p className="text-sm text-center text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link to="/register"
              className="text-[var(--accent-primary)] font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;