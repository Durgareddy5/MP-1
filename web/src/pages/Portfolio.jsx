import tradingService from '@/services/tradingService';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, TrendingUp, TrendingDown, RefreshCw,
  ArrowUpRight, ArrowDownRight, Search, Filter,
  BarChart3, PieChart as PieChartIcon, Eye,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR, formatPercent, getPnLColor } from '@/utils/formatters';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import useMarketStore from '@/store/marketStore';
import useMarketSubscription from '@/hooks/useMarketSubscription';


/* ─── mock data ─────────────────────────────── */
const MOCK_HOLDINGS = [
  { symbol: 'RELIANCE',   name: 'Reliance Industries Ltd', exchange: 'NSE',
    sector: 'Energy',     qty: 150, avg_price: 1250.50, current_price: 1285.50,
    total_invested: 187575, current_value: 192825,
    pnl: 5250,  pnl_pct: 2.80,  day_change: 1890,  day_change_pct: 0.97 },
  { symbol: 'TCS',        name: 'Tata Consultancy Services', exchange: 'NSE',
    sector: 'IT',         qty: 50,  avg_price: 3480.00, current_price: 3542.80,
    total_invested: 174000, current_value: 177140,
    pnl: 3140,  pnl_pct: 1.80,  day_change: -1408, day_change_pct: -0.79 },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank Ltd',            exchange: 'NSE',
    sector: 'Banking',    qty: 200, avg_price: 1690.00, current_price: 1672.30,
    total_invested: 338000, current_value: 334460,
    pnl: -3540, pnl_pct: -1.05, day_change: 3132,  day_change_pct: 0.94 },
  { symbol: 'INFY',       name: 'Infosys Ltd',              exchange: 'NSE',
    sector: 'IT',         qty: 100, avg_price: 1475.00, current_price: 1495.25,
    total_invested: 147500, current_value: 149525,
    pnl: 2025,  pnl_pct: 1.37,  day_change: 840,   day_change_pct: 0.56 },
  { symbol: 'WIPRO',      name: 'Wipro Ltd',                exchange: 'NSE',
    sector: 'IT',         qty: 300, avg_price: 485.00,  current_price: 472.65,
    total_invested: 145500, current_value: 141795,
    pnl: -3705, pnl_pct: -2.55, day_change: -930,  day_change_pct: -0.65 },
  { symbol: 'SUNPHARMA',  name: 'Sun Pharmaceutical',       exchange: 'NSE',
    sector: 'Pharma',     qty: 80,  avg_price: 1780.00, current_price: 1812.30,
    total_invested: 142400, current_value: 144984,
    pnl: 2584,  pnl_pct: 1.81,  day_change: 1960,  day_change_pct: 1.37 },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank Ltd',           exchange: 'NSE',
    sector: 'Banking',    qty: 120, avg_price: 1310.00, current_price: 1289.45,
    total_invested: 157200, current_value: 154734,
    pnl: -2466, pnl_pct: -1.57, day_change: -624,  day_change_pct: -0.40 },
];

const SECTOR_COLORS = {
  Energy: '#0052FF', IT: '#7C3AED', Banking: '#00E676',
  Pharma: '#FFB300', FMCG: '#FF6B35', Auto: '#29B6F6',
};

const SORT_OPTIONS = [
  { value: 'pnl_desc',      label: 'P&L (High to Low)' },
  { value: 'pnl_asc',       label: 'P&L (Low to High)' },
  { value: 'value_desc',    label: 'Value (High to Low)' },
  { value: 'name_asc',      label: 'Name (A-Z)' },
  { value: 'day_change',    label: "Today's Change" },
];

/* ─── holding row ───────────────────────────── */
const HoldingRow = ({ h, onClick, delay }) => (
  <motion.tr
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    onClick={onClick}
    className="border-b border-[var(--border-primary)] cursor-pointer
               hover:bg-[var(--bg-card-hover)] transition-colors duration-150
               group"
  >
    {/* Stock */}
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center
                        font-bold text-sm text-[var(--accent-primary)]
                        bg-[var(--accent-primary)]/10 flex-shrink-0
                        group-hover:scale-105 transition-transform">
          {h.symbol[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {h.symbol}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[150px]">
            {h.name}
          </p>
        </div>
      </div>
    </td>

    {/* Exchange + Sector */}
    <td className="px-5 py-4">
      <Badge variant="NSE" size="xs">{h.exchange}</Badge>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">{h.sector}</p>
    </td>

    {/* Qty */}
    <td className="px-5 py-4 text-right">
      <p className="text-sm font-mono font-medium text-[var(--text-primary)]">
        {h.qty}
      </p>
    </td>

    {/* Avg Price */}
    <td className="px-5 py-4 text-right">
      <p className="text-sm font-mono text-[var(--text-primary)]">
        {formatINR(h.avg_price)}
      </p>
    </td>

    {/* LTP */}
    <td className="px-5 py-4 text-right">
      <p className="text-sm font-mono font-semibold text-[var(--text-primary)]">
        {formatINR(h.current_price)}
      </p>
      <p className={`text-xs font-mono ${getPnLColor(h.day_change)}`}>
        {h.day_change >= 0 ? '+' : ''}{formatINR(h.day_change)}
        {' '}({formatPercent(h.day_change_pct)})
      </p>
    </td>

    {/* Invested */}
    <td className="px-5 py-4 text-right">
      <p className="text-sm font-mono text-[var(--text-secondary)]">
        {formatINR(h.total_invested)}
      </p>
    </td>

    {/* Current Value */}
    <td className="px-5 py-4 text-right">
      <p className="text-sm font-mono font-semibold text-[var(--text-primary)]">
        {formatINR(h.current_value)}
      </p>
    </td>

    {/* P&L */}
    <td className="px-5 py-4 text-right">
      <p className={`text-sm font-mono font-bold ${getPnLColor(h.pnl)}`}>
        {h.pnl >= 0 ? '+' : ''}{formatINR(h.pnl)}
      </p>
      <p className={`text-xs font-mono ${getPnLColor(h.pnl_pct)}`}>
        {formatPercent(h.pnl_pct)}
      </p>
    </td>
  </motion.tr>
);

const Portfolio = () => {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('value_desc');

  const ticksByKey = useMarketStore((s) => s.ticksByKey);

  useMarketSubscription({
    symbols: holdings.map((h) => h.symbol),
    enabled: !loading,
  });


  useEffect(() => {
  fetchHoldings();
}, []);

const fetchHoldings = async () => {
  try {
    setLoading(true);
    
    const res = await tradingService.getHoldings();

    console.log("FULL RESPONSE:", res);       // 🔥 VERY IMPORTANT
    console.log("DATA FIELD:", res.data);     // 🔥 THIS IS YOUR HOLDINGS


    const data = res.data || [];

    // 🔥 Transform backend → frontend format
    const formatted = (data || []).map((h) => {
  const qty = Number(h.quantity || 0);
  const avg = Number(h.average_price || 0);
  const ltp = Number(h.current_price ?? avg);
  
  const invested = qty * avg;
  const current  = qty * ltp;
  const pnl      = current - invested;
  const pnlPct   = invested > 0 ? (pnl / invested) * 100 : 0;

  return {
    symbol: (h.symbol || '').toUpperCase(),
    name: h.symbol || 'Unknown',

    // 🔥 FIX: fallback exchange
    exchange: h.exchange || 'NSE',

    sector: h.sector || 'Other',

    qty,
    avg_price: avg,
    current_price: ltp,

    total_invested: invested,
    current_value: current,

    pnl,
    pnl_pct: pnlPct,

    day_change: 0,
    day_change_pct: 0,
  };
   });
    console.log("RAW API:", data);
    console.log("FORMATTED:", formatted);
    setHoldings(formatted);

  } catch (err) {
    console.error("Holdings fetch error:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!holdings.length) return;

    setHoldings((prev) =>
      prev.map((h) => {
        const liveTick = Object.values(ticksByKey || {}).find(
          (tick) => tick.symbol?.toUpperCase() === h.symbol?.toUpperCase()
        );

        if (!liveTick) return h;

        const current_price = liveTick.price ?? h.current_price;
        const current_value = h.qty * current_price;
        const pnl = current_value - h.total_invested;
        const pnl_pct =
          h.total_invested > 0 ? (pnl / h.total_invested) * 100 : 0;

        return {
          ...h,
          current_price,
          current_value,
          pnl,
          pnl_pct,
          day_change: liveTick.change ?? h.day_change,
          day_change_pct: liveTick.changePercent ?? h.day_change_pct,
        };
      })
    );
  }, [ticksByKey]);


  /* summary */
  const totalInvested    = holdings.reduce((s, h) => s + h.total_invested, 0);
  const totalCurrentVal  = holdings.reduce((s, h) => s + h.current_value, 0);
  const totalPnL         = totalCurrentVal - totalInvested;
  const totalPnLPct      = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const todayChange      = holdings.reduce((s, h) => s + h.day_change, 0);

  /* sector allocation for pie */
  const sectorData = holdings.reduce((acc, h) => {
    const existing = acc.find((a) => a.name === h.sector);
    if (existing) {
      existing.value += h.current_value;
    } else {
      acc.push({ name: h.sector, value: h.current_value });
    }
    return acc;
  }, []);

  /* sorted + filtered */
  const display = [...holdings]
    .filter((h) =>
      h.symbol.toLowerCase().includes(search.toLowerCase()) ||
      h.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl_desc':   return b.pnl - a.pnl;
        case 'pnl_asc':    return a.pnl - b.pnl;
        case 'value_desc': return b.current_value - a.current_value;
        case 'name_asc':   return a.symbol.localeCompare(b.symbol);
        case 'day_change': return b.day_change - a.day_change;
        default:           return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
            Portfolio
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Your delivery holdings (CNC) and investment performance
          </p>
        </div>
        <button
          onClick={fetchHoldings}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-[var(--bg-card)] border border-[var(--border-primary)]
                     text-sm text-[var(--text-secondary)]
                     hover:border-[var(--border-secondary)]
                     transition-all duration-200"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{marginBottom: '1rem'}}>
        {[
          { title: 'Invested',       value: formatINR(totalInvested, { compact: true }),
            icon: Briefcase,         color: 'bg-blue-500/10 text-blue-400   border-blue-500/20' },
          { title: 'Current Value',  value: formatINR(totalCurrentVal, { compact: true }),
            icon: BarChart3,         color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
          { title: 'Total P&L',
            value: (totalPnL >= 0 ? '+' : '') + formatINR(totalPnL, { compact: true }),
            sub: formatPercent(totalPnLPct),
            icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
            color: totalPnL >= 0
              ? 'bg-[var(--profit-bg)] text-[var(--profit)] border-[var(--profit-border)]'
              : 'bg-[var(--loss-bg)] text-[var(--loss)] border-[var(--loss-border)]' },
          { title: "Today's Change",
            value: (todayChange >= 0 ? '+' : '') + formatINR(todayChange, { compact: true }),
            icon: todayChange >= 0 ? ArrowUpRight : ArrowDownRight,
            color: todayChange >= 0
              ? 'bg-[var(--profit-bg)] text-[var(--profit)] border-[var(--profit-border)]'
              : 'bg-[var(--loss-bg)] text-[var(--loss)] border-[var(--loss-border)]' },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-md p-4 border ${card.color} bg-transparent`}
            style={{padding: '0.25rem'}}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                {card.title}
              </span>
            </div>
            <p className="text-xl font-heading font-bold">{card.value}</p>
            {card.sub && (
              <p className="text-xs font-mono mt-0.5 opacity-80">{card.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Sector Allocation Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-1 bg-[var(--bg-card)]
                     border border-[var(--border-primary)] rounded-md p-5"
          style={{padding: '0.25rem'}}
          
        >
          <h2 className="text-sm font-heading font-semibold
                         text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <PieChartIcon size={16} className="text-[var(--accent-primary)]" />
            Sector Allocation
          </h2>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={2} dataKey="value"
                  >
                    {sectorData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SECTOR_COLORS[entry.name] || '#666'}
                      />
                    ))}
                  </Pie>
                  <ReTooltip
                    formatter={(v, n) => [
                      formatINR(v, { compact: true }),
                      n,
                    ]}
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {sectorData.map((s) => (
                  <div key={s.name}
                       className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm"
                           style={{ background: SECTOR_COLORS[s.name] || '#666' }} />
                      <span className="text-[var(--text-secondary)]">{s.name}</span>
                    </div>
                    <span className="font-mono text-[var(--text-primary)]">
                      {((s.value / totalCurrentVal) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="xl:col-span-3 bg-[var(--bg-card)]
                     border border-[var(--border-primary)]
                     rounded-md overflow-hidden"
          style={{padding: '0.25rem'}}
        >
          {/* Table toolbar */}
          <div className="flex items-center justify-between gap-3
                          px-5 py-4 border-b border-[var(--border-primary)]">
            <h2 className="text-sm font-heading font-semibold
                           text-[var(--text-primary)]">
              Holdings ({display.length})
            </h2>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Search size={14}
                  className="absolute left-2 top-1/2 -translate-y-1/2
                             text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs
                             bg-[var(--bg-input)] border border-[var(--border-primary)]
                             text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                             focus:outline-none focus:border-[var(--accent-primary)]
                             w-36 transition-all duration-200"
                  style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs
                           bg-[var(--bg-input)] border border-[var(--border-primary)]
                           text-[var(--text-secondary)]
                           focus:outline-none focus:border-[var(--accent-primary)]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]
                               border-b border-[var(--border-primary)]">
                  {['Stock', 'Exchange', 'Qty', 'Avg Price',
                    'LTP / Day Chg', 'Invested', 'Curr. Value', 'P&L'].map((h) => (
                    <th key={h}
                        className={`px-5 py-3 text-[10px] font-bold uppercase
                                   tracking-[0.08em] text-[var(--text-tertiary)]
                                   ${['Qty','Avg Price','LTP / Day Chg',
                                      'Invested','Curr. Value','P&L'].includes(h)
                                     ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}
                        className="border-b border-[var(--border-primary)]">
                      {[...Array(8)].map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : display.length > 0 ? (
                    display.map((h, i) => (
                      <HoldingRow
                        key={h.symbol}
                        h={h}
                        delay={i * 0.04}
                        onClick={() => navigate(`/stock/${h.symbol}`)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-[var(--text-tertiary)]">
                        No holdings found
                      </td>
                    </tr>
                  )
              }
            </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Portfolio;