import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Zap, ArrowRight, Shield, BarChart3, TrendingUp,
  Brain, Eye, Target, Globe, IndianRupee, Lock,
  LineChart, PieChart, Activity, Layers, Cpu,
  ChevronRight, Star, Users, Building2, Wallet,
} from 'lucide-react';
import TrAIdeUrl from "@/assets/TrAIde_1.png";
import Button from '@/components/ui/Button';
import useAuthStore from '@/store/authStore';
import useThemeStore from '@/store/themeStore';
import './Landing.css';

// Animated Background Mesh
const GradientMesh = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(0,82,255,0.15)_0%,transparent_50%)]" />
    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(124,58,237,0.12)_0%,transparent_50%)]" />
    <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-[#0052FF] rounded-full opacity-[0.03] blur-[100px] animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#7C3AED] rounded-full opacity-[0.04] blur-[80px] float" />
  </div>
);

// Floating Particles
const Particles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[var(--accent-primary)]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

// Feature Card
const FeatureCard = ({ icon: Icon, title, description, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="group relative p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all duration-300 card-glow overflow-hidden"
  >
    {/* Gradient Accent */}
    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    
    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4 shadow-lg`}>
      <Icon size={24} className="text-white" />
    </div>
    <h3 className="text-lg font-heading font-semibold text-[var(--text-primary)] mb-2">
      {title}
    </h3>
    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
      {description}
    </p>
  </motion.div>
);

// Stats Counter
const StatItem = ({ value, label, suffix = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="text-center"
  >
    <div className="text-3xl md:text-4xl font-heading font-bold gradient-text">
      {value}{suffix}
    </div>
    <p className="text-sm text-[var(--text-secondary)] mt-1">{label}</p>
  </motion.div>
);

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { initTheme } = useThemeStore();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    initTheme();
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated]);

  const features = [
    {
      icon: LineChart,
      title: 'Real-Time Market Data',
      description: 'Live NSE/BSE data with candlestick charts, depth, and real-time price updates across all Indian indices.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: 'Paper Trading Engine',
      description: 'Execute simulated trades with Market, Limit, Stop-Loss orders. Full order book with realistic charge calculation.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: PieChart,
      title: 'Portfolio Analytics',
      description: 'Track holdings, P&L, sector allocation, and performance metrics with institutional-grade precision.',
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'LSTM & XGBoost models for trend prediction. SHAP/LIME explainability for transparent decision support.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Institutional Security',
      description: 'Enterprise-grade authentication, role-based access control, and comprehensive audit trails.',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: Layers,
      title: 'Multi-Strategy Framework',
      description: 'Build, backtest, and deploy custom trading strategies with risk management and position sizing.',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ];

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] overflow-hidden"
      data-theme="dark"
    >
      <GradientMesh />
      <Particles />

      {/* ─── Navigation ─────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--glass-border)] fixed_1">
        <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center solved">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-3xl flex items-center justify-center shadow-[0_0_20px_rgba(0,82,255,0.3)]">
              <img src={TrAIdeUrl} alt="TrAIde" />
            </div>
            <span className="text-lg font-heading font-bold gradient-text">TrAIde</span>
          </div>

          {/* CENTER */}
          <div className="hidden md:flex items-center justify-center gap-8">
            {['Features', 'Markets', 'Analytics', 'Enterprise'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-end gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="gradient" size="sm" iconRight={ArrowRight} className="rounded">
                <span className="ml-1">Get Started</span>
              </Button>
            </Link>
          </div>

        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────── */}
      <motion.section
        className="relative pt-32 pb-20 px-6 centered_div"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="max-w-5xl mx-auto text-center centered_div_2">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary-light)] border border-[var(--accent-primary)]/20 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--profit)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--accent-primary)]">
              NSE & BSE Live Markets • Paper Trading Platform
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold leading-[1.1] mb-6"
          >
            <span className="text-[var(--text-primary)]">Institutional-Grade</span>
            <br />
            <span className="gradient-text">Stock Trading</span>
            <br />
            <span className="text-[var(--text-primary)]">Intelligence</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI-powered trading platform designed exclusively for MNCs and institutional investors.
            Real-time Indian market data, advanced analytics, and explainable AI predictions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button variant="gradient" size="lg" iconRight={ArrowRight} className="rounded">
                <span style={{"marginLeft" : "4px"}}>Start Paper Trading — Free</span>
              </Button>
            </Link>
            <Button variant="secondary" size="lg" icon={Eye} className="rounded">
              <span style={{"marginLeft" : "4px","marginRight" : "4px"}}>Watch Demo</span>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-10 text-[var(--text-tertiary)] gapped"
          >
            {[
              { icon: Shield, text: 'Bank-Grade Security' },
              { icon: IndianRupee, text: '₹1 Crore Virtual Capital' },
              { icon: Globe, text: 'NSE + BSE Coverage' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs">
                <item.icon size={14} />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Hero Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative z-10 mt-16 max-w-4xl mx-auto"
          >
            <div className="relative rounded-md overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_25px_80px_-12px_rgba(0,82,255,0.25)] p-2"
              style={{maxHeight: "310px",maxWidth: "677px"}}>

              {/* Dashboard */}
              <div className="aspect-video p-4" style={{padding: "0.25rem"}}>

                {/* Top bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex-1 text-center text-xs text-white/60" style={{justifyItems: "center"}}>
                    Dashboard Overview
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-3 mb-3" style={{marginBottom: "0.75rem"}}>
                  {[
                    { title: "Revenue", value: "$12,430", change: "+8%" },
                    { title: "Users", value: "2,340", change: "+12%" },
                    { title: "Orders", value: "1,120", change: "+5%" },
                    { title: "Growth", value: "18%", change: "+3%" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-white/[0.04] border border-white/10 p-3 backdrop-blur-md"
                    >
                      <p className="text-xs text-white/60">{item.title}</p>
                      <h3 className="text-lg font-semibold text-white">
                        {item.value}
                      </h3>
                      <span className="text-xs text-green-400">
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Charts section */}
                <div className="grid grid-cols-3 gap-3">

                  {/* Main chart */}
                  <div className="col-span-2 rounded-md bg-white/[0.04] border border-white/10 p-3 h-44 backdrop-blur-md">
                    <p className="text-xs text-white/60 mb-2">
                      Revenue Trend
                    </p>

                    <svg viewBox="0 0 400 120" className="w-full h-28">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0052FF" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      <path
                        d="M0,90 Q50,85 80,70 T160,55 Q190,60 220,40 T300,35 Q330,30 360,20 L400,15 L400,120 L0,120 Z"
                        fill="url(#chartGradient)"
                      />

                      <path
                        d="M0,90 Q50,85 80,70 T160,55 Q190,60 220,40 T300,35 Q330,30 360,20 L400,15"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  {/* Side stats */}
                  <div className="rounded-md bg-white/[0.04] border border-white/10 p-3 backdrop-blur-md" style={{padding: "0.5rem"}}>
                    <p className="text-xs text-white/60 mb-2">
                      Top Assets
                    </p>

                    <div className="space-y-2 text-xs text-white/80">
                      {[
                        { name: "AAPL", value: "$189" },
                        { name: "TSLA", value: "$250" },
                        { name: "GOOG", value: "$135" },
                        { name: "AMZN", value: "$145" },
                        { name: "MSFT", value: "$310" },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-green-400">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Features Section ───────────────────────── */}
      <section id="features" className="relative py-20 px-6 fixed">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Powerful Features for Smart Trading
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto centered_div_3">
              Everything you need to analyze, simulate, and execute trading strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 justify-center items-center rounded">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Section ───────────────────────── */}
      <section className="py-16 px-6 border-t border-[var(--border-primary)] centered_div_3">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem value="10K+" label="Active Traders" />
          <StatItem value="₹500Cr+" label="Simulated Volume" />
          <StatItem value="99.9%" label="Uptime" />
          <StatItem value="24/7" label="Support" />
        </div>
      </section>

      {/* ─── Footer ───────────────────────── */}
      <footer className="py-10 px-6 border-t border-[var(--border-primary)] text-center text-sm text-[var(--text-tertiary)]">
        © {new Date().getFullYear()} TrAIde. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;