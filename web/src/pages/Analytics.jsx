import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, PieChart as PieChartIcon,
  Target, Award, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatINR, formatPercent, getPnLColor } from '@/utils/formatters';
import Skeleton from '@/components/ui/Skeleton';
import tradingService from '@/services/tradingService';

const PERIODS = ['1M','3M','6M','1Y','All'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const sectorColors = ['#0052FF','#7C3AED','#00E676','#FFB300','#FF6B35','#29B6F6','#EC4899','#A3E635'];

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getPeriodCutoff = (period) => {
  if (period === 'All') return null;
  const now = new Date();

  const months = period === '1M' ? 1 : period === '3M' ? 3 : period === '6M' ? 6 : 12;
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (d) => `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;

const computeRealizedPnL = (trades) => {
  // FIFO lots per symbol. Returns list of "closed legs" with realized pnl.
  // Assumption: buy opens long lots; sell closes them. If sells exceed buys, treat as short.
  const lotsBySymbol = new Map();
  const closes = [];

  const sorted = [...trades].sort((a, b) => new Date(a.executed_at) - new Date(b.executed_at));

  for (const t of sorted) {
    const symbol = String(t.symbol || '').toUpperCase();
    if (!symbol) continue;

    const qty = toNumber(t.quantity);
    const price = toNumber(t.price);
    if (!qty || !price) continue;

    const executedAt = new Date(t.executed_at || Date.now());
    const side = String(t.transaction_type || '').toLowerCase();

    const lots = lotsBySymbol.get(symbol) || [];

    if (side === 'buy') {
      lots.push({ qty, price });
      lotsBySymbol.set(symbol, lots);
      continue;
    }

    if (side !== 'sell') continue;

    let remaining = qty;
    let realized = 0;
    let buyNotional = 0;

    while (remaining > 0 && lots.length > 0) {
      const lot = lots[0];
      const closeQty = Math.min(remaining, lot.qty);
      realized += (price - lot.price) * closeQty;
      buyNotional += lot.price * closeQty;

      lot.qty -= closeQty;
      remaining -= closeQty;

      if (lot.qty <= 0) lots.shift();
    }

    // If selling without inventory, treat as short open. For analytics, realized is 0 here.
    // (We could model short lots, but keeping it simple and consistent.)

    if (qty - remaining > 0) {
      closes.push({
        symbol,
        executed_at: executedAt.toISOString(),
        pnl: realized,
        invested: buyNotional,
        type: 'sell',
      });
    }

    lotsBySymbol.set(symbol, lots);
  }

  return closes;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)]
                    rounded-xl px-4 py-3 shadow-[var(--shadow-lg)]">
      <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className={`text-sm font-mono font-bold ${getPnLColor(val)}`}>
        {val >= 0 ? '+' : ''}{formatINR(val)}
      </p>
    </div>
  );
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('1Y');
  const [monthlyPnL, setMonthlyPnL]   = useState([]);
  const [winRate,    setWinRate]       = useState(null);
  const [sectorAlloc,setSectorAlloc]  = useState([]);
  const [topTrades,  setTopTrades]    = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await tradingService.getAnalytics({ period });
        const data = res?.data || {};

        setMonthlyPnL(data.monthly_pnl || []);
        setWinRate(data.win_rate || null);

        const sectors = (data.sector_alloc || []).map((s, idx) => ({
          ...s,
          color: sectorColors[idx % sectorColors.length],
        }));
        setSectorAlloc(sectors);

        const top = (data.top_trades || []).map((t) => {
          const d = new Date(t.date || Date.now());
          return {
            symbol: t.symbol,
            name: t.symbol,
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
            type: t.type,
            pnl: toNumber(t.pnl),
            pct: toNumber(t.pct),
          };
        });
        setTopTrades(top);
      } catch (_) {
        setMonthlyPnL([]);
        setWinRate({
          winning: 0,
          losing: 0,
          avgWin: 0,
          avgLoss: 0,
          bestTrade: 0,
          worstTrade: 0,
          totalTrades: 0,
          winStreak: 0,
          lossStreak: 0,
        });
        setSectorAlloc([]);
        setTopTrades([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [period]);

  const totalPnL = monthlyPnL.reduce((s, m) => s + m.pnl, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
            Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Deep-dive into your trading performance metrics
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5 bg-[var(--bg-card)]
                        border border-[var(--border-primary)] rounded-lg p-1" style={{padding: '0.25rem'}}>
          {PERIODS.map((p) => (
            <button key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold
                         transition-all duration-200
                         ${period === p
                           ? 'bg-[var(--accent-primary)] text-white'
                           : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              style={{padding: '0.1rem'}}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{marginTop: '0.5rem',marginBottom: '0.5rem'}}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-md"/>
            ))
          : [
              { label:'Total P&L',   value: formatINR(totalPnL, { compact:true }),
                sub: formatPercent(2.86), up: totalPnL >= 0,
                icon: totalPnL >= 0 ? TrendingUp : TrendingDown },
              { label:'Win Rate',    value: `${winRate?.winning}%`,
                sub: `${winRate?.totalTrades} trades`, up: true, icon: Target },
              { label:'Best Trade',  value: formatINR(winRate?.bestTrade, { compact:true }),
                sub: '+7.82%', up: true, icon: Award },
              { label:'Avg Win/Loss',
                value: `${(winRate?.avgWin / winRate?.avgLoss).toFixed(2)}x`,
                sub: `₹${(winRate?.avgWin / 1000).toFixed(1)}K / ₹${(winRate?.avgLoss / 1000).toFixed(1)}K`,
                up: true, icon: BarChart3 },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-md p-5 border
                            ${kpi.up
                              ? 'bg-gradient-to-br from-green-500/8 border-green-500/20'
                              : 'bg-gradient-to-br from-red-500/8 border-red-500/20'}`}
                style={{padding: '0.25rem'}}
              >
                <div className="flex items-center gap-2 mb-3">
                  <kpi.icon size={16}
                    className={kpi.up ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}/>
                  <span className="text-xs font-medium uppercase tracking-wider
                                   text-[var(--text-secondary)]">{kpi.label}</span>
                </div>
                <p className="text-2xl font-heading font-bold
                              text-[var(--text-primary)]">{kpi.value}</p>
                <p className={`text-xs font-mono mt-1
                               ${kpi.up ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                  {kpi.sub}
                </p>
              </motion.div>
            ))
        }
      </div>

      {/* Charts Row 1 */}
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" style={{marginBottom: '0.5rem'}}>

        {/* Monthly P&L bar chart */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.3 }}
          className="xl:col-span-2 bg-[var(--bg-card)]
                     border border-[var(--border-primary)] rounded-md p-5"
          style={{padding: '0.25rem'}}
        >
          <h2 className="text-sm font-heading font-semibold
                         text-[var(--text-primary)] mb-5">
            Monthly P&L (FY 2024-25)
          </h2>
          {loading ? <Skeleton className="h-56 rounded-xl"/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyPnL}
                margin={{ top:5, right:5, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="var(--border-primary)" vertical={false}/>
                <XAxis dataKey="month"
                  tick={{ fontSize:11, fill:'var(--text-tertiary)',
                          fontFamily:'JetBrains Mono' }}
                  axisLine={false} tickLine={false}/>
                <YAxis
                  tick={{ fontSize:11, fill:'var(--text-tertiary)',
                          fontFamily:'JetBrains Mono' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${v >= 0 ? '+' : ''}${(v/1000).toFixed(0)}K`}
                  width={48}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="pnl" radius={[4,4,0,0]}>
                  {monthlyPnL.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.pnl >= 0
                        ? 'var(--profit)' : 'var(--loss)'}
                      fillOpacity={0.8}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Sector allocation pie */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35 }}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                     rounded-md p-5"
          style={{padding: '0.5rem'}}
        >
          <h2 className="text-sm font-heading font-semibold
                         text-[var(--text-primary)] mb-5">
            Sector Allocation
          </h2>
          {loading ? <Skeleton className="h-56 rounded-xl"/> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sectorAlloc} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {sectorAlloc.map((s) => (
                      <Cell key={s.name} fill={s.color}/>
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {sectorAlloc.map((s) => (
                  <div key={s.name}
                       className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm"
                           style={{ background: s.color }}/>
                      <span className="text-[var(--text-secondary)]">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[var(--bg-tertiary)] rounded-full">
                        <div className="h-full rounded-full"
                             style={{ width:`${s.value}%`, background: s.color }}/>
                      </div>
                      <span className="font-mono text-[var(--text-primary)] w-8 text-right">
                        {s.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Win Rate + Top Trades */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Win/Loss ratio */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.4 }}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                     rounded-md p-5"
          style={{padding: '0.25rem'}}
        >
          <h2 className="text-sm font-heading font-semibold
                         text-[var(--text-primary)] mb-5">
            Win/Loss Analysis
          </h2>
          {loading || !winRate ? <Skeleton className="h-44 rounded-xl"/> : (
            <div className="space-y-5">
              {/* Ratio bar */}
              <div style={{marginBottom: '0.5rem'}}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[var(--profit)] font-semibold">
                    {winRate.winning}% Win
                  </span>
                  <span className="text-[var(--loss)] font-semibold">
                    {winRate.losing}% Loss
                  </span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  <div className="bg-[var(--profit)] rounded-l-full"
                       style={{ width:`${winRate.winning}%` }}/>
                  <div className="bg-[var(--loss)] rounded-r-full flex-1"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Avg Win',     value: formatINR(winRate.avgWin),  up:true  },
                  { label:'Avg Loss',    value: formatINR(winRate.avgLoss), up:false },
                  { label:'Best Trade',  value: formatINR(winRate.bestTrade), up:true },
                  { label:'Worst Trade', value: formatINR(winRate.worstTrade),up:false},
                  { label:'Win Streak',  value: `${winRate.winStreak} trades`, up:true  },
                  { label:'Loss Streak', value: `${winRate.lossStreak} trades`,up:false },
                ].map(({ label, value, up }) => (
                  <div key={label}
                       className="p-3 rounded-md bg-[var(--bg-tertiary)]
                                  border border-[var(--border-primary)]" style={{padding: '0.25rem'}}>
                    <p className="text-[10px] text-[var(--text-tertiary)]
                                  uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-sm font-mono font-semibold
                                   ${up ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Top Trades */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.45 }}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                     rounded-md overflow-hidden"
          style={{padding: '0.25rem'}}
        >
          <div className="px-5 py-4 border-b border-[var(--border-primary)]">
            <h2 className="text-sm font-heading font-semibold
                           text-[var(--text-primary)]">
              Top 5 Trades (by P&L)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]
                               border-b border-[var(--border-primary)]">
                  {['Stock','Date','P&L','%'].map((h) => (
                    <th key={h}
                        className={`px-5 py-3 text-[10px] font-bold uppercase
                                   tracking-[0.08em] text-[var(--text-tertiary)]
                                   ${['P&L','%'].includes(h) ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}
                          className="border-b border-[var(--border-primary)]">
                        {[...Array(4)].map((__, j) => (
                          <td key={j} className="px-5 py-3">
                            <Skeleton className="h-4 w-20"/>
                          </td>
                        ))}
                      </tr>
                    ))
                  : topTrades.map((t, i) => (
                      <motion.tr
                        key={t.symbol}
                        initial={{ opacity:0, x:10 }}
                        animate={{ opacity:1, x:0 }}
                        transition={{ delay: i * 0.07 }}
                        className="border-b border-[var(--border-primary)]
                                   hover:bg-[var(--bg-card-hover)]
                                   transition-colors duration-150"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-md flex items-center
                                            justify-center text-xs font-bold
                                            ${t.pnl >= 0
                                              ? 'bg-[var(--profit-bg)] text-[var(--profit)]'
                                              : 'bg-[var(--loss-bg)] text-[var(--loss)]'}`}>
                              {t.symbol[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold
                                            text-[var(--text-primary)]">{t.symbol}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">
                                {t.type.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono
                                       text-[var(--text-tertiary)]">
                          {t.date}
                        </td>
                        <td className={`px-5 py-3 text-right text-sm font-mono
                                        font-bold ${getPnLColor(t.pnl)}`}>
                          {t.pnl >= 0 ? '+' : ''}{formatINR(t.pnl)}
                        </td>
                        <td className={`px-5 py-3 text-right text-xs font-mono
                                        font-semibold ${getPnLColor(t.pct)}`}>
                          {t.pct >= 0 ? '+' : ''}{t.pct.toFixed(2)}%
                        </td>
                      </motion.tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;