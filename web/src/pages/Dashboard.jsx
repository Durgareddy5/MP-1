import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  IndianRupee, Activity, Eye, ChevronRight,
  Clock, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import useAuthStore from '@/store/authStore';
import tradingService from '@/services/tradingService';
import { formatINR, formatPercent, formatDate, getPnLColor } from '@/utils/formatters';
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import useMarketStore from '@/store/marketStore';
import useMarketSubscription from '@/hooks/useMarketSubscription';

const SummaryCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
  loading,
  delay = 0,
}) => {
  const colorMap = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', icon: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'from-green-500/10 to-green-600/5', icon: 'text-[var(--profit)]', border: 'border-green-500/20' },
    red: { bg: 'from-red-500/10 to-red-600/5', icon: 'text-[var(--loss)]', border: 'border-red-500/20' },
    purple: { bg: 'from-purple-500/10 to-purple-600/5', icon: 'text-purple-400', border: 'border-purple-500/20' },
  };

  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative rounded-md p-5 border ${c.border} bg-gradient-to-br ${c.bg} hover:border-opacity-40 transition-all duration-300 overflow-hidden group`}
      style={{ padding: '0.25rem' }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[var(--gradient-glow)]" />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              {title}
            </p>
            <div className={`p-2 rounded-lg bg-[var(--bg-tertiary)] ${c.icon}`}>
              <Icon size={18} />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-1">
            {value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-mono font-semibold ${getPnLColor(change)}`}>
              {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{formatPercent(Math.abs(change))}</span>
              {changeLabel && (
                <span className="text-[var(--text-tertiary)] font-normal ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const IndexPill = ({ name, value, change, changePercent, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all duration-200 cursor-pointer group"
  >
    <div>
      <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{name}</p>
      <p className="font-mono font-semibold text-sm text-[var(--text-primary)]">
        {Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
    <div className={`text-right ${getPnLColor(changePercent)}`}>
      <p className="text-xs font-mono font-semibold">
        {Number(changePercent || 0) >= 0 ? '+' : ''}{Number(changePercent || 0).toFixed(2)}%
      </p>
      <p className="text-xs font-mono text-[var(--text-tertiary)]">
        {Number(change || 0) >= 0 ? '+' : ''}{Number(change || 0).toFixed(2)}
      </p>
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl px-4 py-3 shadow-[var(--shadow-lg)]">
      <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-sm font-mono font-bold text-[var(--text-primary)]">
        {formatINR(payload[0].value)}
      </p>
    </div>
  );
};

const HoldingRow = ({ holding, onClick }) => (
  <motion.tr
    whileHover={{ backgroundColor: 'var(--bg-card-hover)' }}
    onClick={onClick}
    className="border-b border-[var(--border-primary)] cursor-pointer transition-colors duration-150"
  >
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
          <span className="text-xs font-bold text-[var(--accent-primary)]">
            {holding.symbol?.[0] || '?'}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {holding.symbol}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[120px]">
            {holding.stock_name}
          </p>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-primary)]">
      {holding.quantity}
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-primary)]">
      {formatINR(holding.average_price)}
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-primary)]">
      {formatINR(holding.current_price || 0)}
    </td>
    <td className="px-4 py-3 text-right">
      <span className={`text-sm font-mono font-semibold ${getPnLColor(holding.pnl)}`}>
        {holding.pnl >= 0 ? '+' : ''}{formatINR(holding.pnl || 0)}
      </span>
      <p className={`text-xs font-mono ${getPnLColor(holding.pnl_percentage)}`}>
        {formatPercent(holding.pnl_percentage || 0)}
      </p>
    </td>
  </motion.tr>
);

const PositionRow = ({ position, onClick }) => (
  <tr
    className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
    onClick={onClick}
  >
    <td className="px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{position.symbol}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{position.product_type || 'MIS'}</p>
      </div>
    </td>
    <td className="px-4 py-3 text-right text-sm font-mono text-[var(--text-primary)]">
      {position.net_quantity}
    </td>
    <td className="px-4 py-3 text-right text-sm font-mono text-[var(--text-primary)]">
      {formatINR(position.current_price || 0)}
    </td>
    <td className="px-4 py-3 text-right">
      <span className={`text-sm font-mono font-semibold ${getPnLColor(position.total_pnl || 0)}`}>
        {(position.total_pnl || 0) >= 0 ? '+' : ''}{formatINR(position.total_pnl || 0)}
      </span>
    </td>
  </tr>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [funds, setFunds] = useState(null);
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [positions, setPositions] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [indices, setIndices] = useState([]);
  const [chartData, setChartData] = useState([]);
  const ticks = useMarketStore((s) => s.ticks);
  const [indexSubscriptions, setIndexSubscriptions] = useState([]);


  useMarketSubscription({
    symbols: holdings.map((h) => h.symbol).filter(Boolean),
    indices: indexSubscriptions,
    enabled: !loading,
  });


  const buildTrendFromSnapshots = (trendPayload, summaryPayload) => {
    const points = Array.isArray(trendPayload?.points) ? trendPayload.points : [];
    if (!points.length) {
      return [{
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        value: Number(summaryPayload?.current_value || 0),
      }];
    }

    return points.map((p) => ({
      date: new Date(`${p.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      value: Number(p.equity_value || 0),
    }));
  };

  const normalizeHolding = (holding) => ({
    ...holding,
    symbol: (holding.symbol || '').toUpperCase(),
    stock_name: holding.stock_name || holding.symbol || 'Unknown',
    quantity: Number(holding.quantity || 0),
    average_price: Number(holding.average_price || 0),
    current_price: Number(holding.current_price || 0),
    pnl: Number(holding.pnl || 0),
    pnl_percentage: Number(holding.pnl_percentage || 0),
  });

  const normalizeIndex = (index) => ({
    name: index.name || index.symbol || 'Index',
    symbol: (index.symbol || index.name || '').toUpperCase().replace(/\s+/g, '_'),
    value: Number(index.current_value || 0),
    change: Number(index.change || 0),
    changePercent: Number(index.change_percent || 0),
  });

  const fetchData = async () => {
    try {
      setRefreshing(true);

      const [fundsRes, summaryRes, holdingsRes, positionsRes, indicesRes, tradesRes, trendRes] = await Promise.all([
        tradingService.getFunds(),
        tradingService.getPortfolioSummary(),
        tradingService.getHoldings(),
        tradingService.getPositions({ status: 'open' }),
        tradingService.getMarketIndices(),
        tradingService.getTradeLogs({ page: 1, limit: 5 }),
        tradingService.getPortfolioTrend({ days: 30 }),
      ]);

      setFunds(fundsRes?.data || null);
      setSummary(summaryRes?.data || null);
      setHoldings((holdingsRes?.data || []).map(normalizeHolding));
      setPositions(positionsRes?.data || []);
      setIndices((indicesRes?.data || []).map(normalizeIndex));
      setRecentTrades(
        (tradesRes?.data?.trades || []).map((t) => ({
          ...t,
          quantity: Number(t.quantity || 0),
          price: Number(t.price || 0),
          total_value: Number(t.total_value || 0),
          total_charges: Number(t.total_charges || 0),
          net_value: Number(t.net_value || 0),
        }))
      );

      setIndexSubscriptions(
        (indicesRes?.data || [])
          .map((idx) => idx.name || idx.symbol)
          .filter(Boolean)
      );

      setChartData(buildTrendFromSnapshots(trendRes?.data, summaryRes?.data));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!ticks || ticks.length === 0) return;

    setHoldings((prev) =>
      prev.map((h) => {
        const tick = ticks.find(
          (t) => t.symbol?.replace('.NS','') === h.symbol
        );

        if (!tick) return h;

        const currentPrice = tick.price ?? h.current_price;
        const pnl = (currentPrice - h.average_price) * h.quantity;
        const pnlPercentage =
          h.average_price > 0
            ? ((currentPrice - h.average_price) / h.average_price) * 100
            : 0;

        return {
          ...h,
          current_price: currentPrice,
          pnl,
          pnl_percentage: pnlPercentage,
        };
      })
    );

    setIndices((prev) =>
      prev.map((idx) => {
        const tick = ticks.find((t) => {
          const tickSymbol = t.symbol?.toUpperCase();
          const candidates = [
            idx.symbol?.toUpperCase(),
            idx.name?.toUpperCase(),
            idx.name?.toUpperCase().replace(/\s+/g, '_'),
          ].filter(Boolean);

          return candidates.includes(tickSymbol);
        });

        if (!tick) return idx;

        return {
          ...idx,
          value: tick.price ?? idx.value,
          change: tick.change ?? idx.change,
          changePercent: tick.changePercent ?? idx.changePercent,
        };
      })
    );
  }, [ticks]);

  useEffect(() => {
    if (!holdings.length) return;

    const total_invested = holdings.reduce(
      (sum, h) => sum + (h.average_price * h.quantity),
      0
    );

    const current_value = holdings.reduce(
      (sum, h) => sum + ((h.current_price || 0) * h.quantity),
      0
    );

    const total_pnl = current_value - total_invested;
    const total_pnl_percentage =
      total_invested > 0 ? (total_pnl / total_invested) * 100 : 0;

    setSummary((prev) => ({
      ...(prev || {}),
      total_invested,
      current_value,
      total_pnl,
      total_pnl_percentage,
    }));
  }, [holdings]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-heading font-bold text-[var(--text-primary)]"
          >
            {greeting},{' '}
            <span className="bg-gradient-to-r from-[#0052FF] to-[#7C3AED] bg-clip-text text-transparent">
              {user?.first_name || 'Trader'}
            </span>
          </motion.h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-all duration-200"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Available Funds"
          value={loading ? '—' : formatINR(funds?.available_balance || 0, { compact: true })}
          icon={Wallet}
          color="blue"
          loading={loading}
          delay={0.05}
        />
        <SummaryCard
          title="Portfolio Value"
          value={loading ? '—' : formatINR(summary?.current_value || 0, { compact: true })}
          change={summary?.total_pnl_percentage}
          changeLabel="all time"
          icon={BarChart3}
          color="purple"
          loading={loading}
          delay={0.1}
        />
        <SummaryCard
          title="Total P&L"
          value={loading ? '—' : formatINR(summary?.total_pnl || 0, { compact: true })}
          change={summary?.total_pnl_percentage}
          changeLabel="all time"
          icon={(summary?.total_pnl || 0) >= 0 ? TrendingUp : TrendingDown}
          color={(summary?.total_pnl || 0) >= 0 ? 'green' : 'red'}
          loading={loading}
          delay={0.15}
        />
        <SummaryCard
          title="Day Change"
          value={loading ? '—' : formatINR(summary?.day_change || 0, { compact: true })}
          change={summary?.day_change_percentage}
          changeLabel="today"
          icon={Activity}
          color={(summary?.day_change || 0) >= 0 ? 'green' : 'red'}
          loading={loading}
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4" style={{padding: '0.25rem'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Portfolio Trend</h2>
              <p className="text-sm text-[var(--text-secondary)]">Daily equity curve from DB snapshots</p>
            </div>
            <Badge variant="default">Live</Badge>
          </div>

          {loading ? (
            <SkeletonCard className="h-[320px]" />
          ) : (
            <div className="h-[320px]" style={{ minHeight: 320, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0052FF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0052FF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                    tickFormatter={(value) => formatINR(value, { compact: true })}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0052FF"
                    strokeWidth={2}
                    fill="url(#portfolioFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
          <div className="flex items-center justify-between mb-4" style={{padding: '0.25rem'}}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Market Indices</h2>
            <button
              onClick={() => navigate('/markets')}
              className="text-sm text-[var(--accent-primary)] flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3" style={{padding: '0.25rem'}}>
            {loading
              ? Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 rounded-md p-16" />
                ))
              : indices.slice(0, 8).map((idx) => (
                  <IndexPill
                    key={idx.symbol}
                    name={idx.name}
                    value={idx.value}
                    change={idx.change}
                    changePercent={idx.changePercent}
                    onClick={() => navigate(`/stock/${idx.symbol}`)}
                  />
                ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
          <div className="flex items-center justify-between mb-4" style={{padding: '0.25rem'}}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Holdings</h2>
            <button
              onClick={() => navigate('/portfolio')}
              className="text-sm text-[var(--accent-primary)] flex items-center gap-1"
            >
              Portfolio <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : holdings.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="mx-auto mb-3 text-[var(--text-tertiary)]" size={28} />
              <p className="text-sm text-[var(--text-secondary)]">No holdings yet</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Place your first order to build your portfolio
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{padding: '0.25rem'}}>
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Avg</th>
                    <th className="px-4 py-3 text-right">LTP</th>
                    <th className="px-4 py-3 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.slice(0, 5).map((holding) => (
                    <HoldingRow
                      key={holding.id || holding.symbol}
                      holding={holding}
                      onClick={() => navigate('/portfolio')}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
          <div className="flex items-center justify-between mb-4" style={{padding: '0.25rem'}}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Open Positions</h2>
            <button
              onClick={() => navigate('/positions')}
              className="text-sm text-[var(--accent-primary)] flex items-center gap-1"
            >
              Positions <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto mb-3 text-[var(--text-tertiary)]" size={28} />
              <p className="text-sm text-[var(--text-secondary)]">No open positions</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Intraday positions will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{padding: '0.25rem'}}>
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">LTP</th>
                    <th className="px-4 py-3 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.slice(0, 5).map((position) => (
                    <PositionRow
                      key={position.id || position.symbol}
                      position={position}
                      onClick={() => navigate(`/stock/${position.symbol}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Trades</h2>
          <button
            onClick={() => navigate('/trades')}
            className="text-sm text-[var(--accent-primary)] flex items-center gap-1"
          >
            Trades <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : recentTrades.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-3 text-[var(--text-tertiary)]" size={28} />
            <p className="text-sm text-[var(--text-secondary)]">No trades yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Your executed trades will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t) => {
                  const isBuy = String(t.transaction_type || '').toLowerCase() === 'buy';
                  return (
                    <tr
                      key={t.id || t.trade_number}
                      className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
                      onClick={() => navigate(`/stock/${t.symbol}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                            ${isBuy ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                            {t.symbol?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{t.symbol}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">{formatDate(t.executed_at, 'datetime')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isBuy ? 'buy' : 'sell'} size="xs">
                          {t.transaction_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-primary)]">
                        {t.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-primary)]">
                        {formatINR(t.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {formatINR(t.net_value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4" style={{padding: '0.25rem'}}>
          <div className="flex items-center gap-3 mb-2">
            <IndianRupee className="text-[var(--accent-primary)]" size={18} />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Virtual Balance</h3>
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {formatINR(funds?.available_balance || 0)}
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4" style={{padding: '0.25rem'}}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-[var(--profit)]" size={18} />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Last Updated</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {formatDate(new Date(), 'datetime')}
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4" style={{padding: '0.25rem'}}>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-[var(--warning)]" size={18} />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Session</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Dashboard data loaded from API
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
