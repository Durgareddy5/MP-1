import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Search, ChevronDown,
  TrendingUp, TrendingDown,
} from 'lucide-react';

import tradingService from '@/services/tradingService';
import { formatINR, formatDate, getPnLColor } from '@/utils/formatters';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'buy', label: 'Buy' },
  { key: 'sell', label: 'Sell' },
];

const TradeRow = ({ trade, onOpenStock }) => {
  const [open, setOpen] = useState(false);
  const isBuy = trade.transaction_type === 'buy';

  return (
    <>
      <motion.tr
        layout
        onClick={() => setOpen(!open)}
        className="border-b border-[var(--border-primary)] cursor-pointer
                   hover:bg-[var(--bg-card-hover)] transition"
      >
        {/* Symbol */}
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenStock?.(trade);
            }}
            className="flex items-center gap-2 text-left"
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold
              ${isBuy ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
              {trade.symbol?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{trade.symbol}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{trade.exchange}</p>
            </div>
          </button>
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          <Badge variant={isBuy ? 'buy' : 'sell'} size="xs">
            {trade.transaction_type}
          </Badge>
        </td>

        {/* Qty */}
        <td className="px-4 py-3 text-right font-mono">
          {trade.quantity}
        </td>

        {/* Price */}
        <td className="px-4 py-3 text-right font-mono">
          {formatINR(trade.price)}
        </td>

        {/* Total */}
        <td className="px-4 py-3 text-right font-mono">
          {formatINR(trade.total_value)}
        </td>

        {/* Charges */}
        <td className="px-4 py-3 text-right font-mono text-[var(--loss)]">
          {formatINR(trade.total_charges)}
        </td>

        {/* Net */}
        <td className="px-4 py-3 text-right font-mono font-bold">
          {formatINR(trade.net_value)}
        </td>

        {/* Expand */}
        <td className="px-4 py-3 text-center">
          <ChevronDown className={`${open ? 'rotate-180' : ''}`} size={16} />
        </td>
      </motion.tr>

      <AnimatePresence>
        {open && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <td colSpan={8} className="px-6 py-4 bg-[var(--bg-secondary)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Trade ID</p>
                  <p className="font-mono text-sm">{trade.trade_number}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Order ID</p>
                  <p className="font-mono text-sm">{trade.order_id}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Executed</p>
                  <p className="font-mono text-sm">
                    {formatDate(trade.executed_at, 'datetime')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Product</p>
                  <p className="font-mono text-sm">{trade.product_type}</p>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

const Trades = () => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 50;

  const fetchTrades = async ({ nextPage = 1, append = false } = {}) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await tradingService.getTradeLogs({ page: nextPage, limit: LIMIT });

      const data = res?.data?.trades || [];
      const pagination = res?.data?.pagination || {};

      const totalPages = Number(pagination.total_pages || 1);
      const currentPage = Number(pagination.page || nextPage);

      const normalized = data.map((t) => ({
        ...t,
        quantity: Number(t.quantity || 0),
        price: Number(t.price || 0),
        total_value: Number(t.total_value || 0),
        total_charges: Number(t.total_charges || 0),
        net_value: Number(t.net_value || 0),
      }));

      setTrades((prev) => {
        if (!append) return normalized;

        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const t of normalized) {
          if (t?.id && !seen.has(t.id)) {
            merged.push(t);
            seen.add(t.id);
          }
        }
        return merged;
      });

      setPage(currentPage);
      setHasMore(currentPage < totalPages);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTrades({ nextPage: 1, append: false });
  }, []);

  const filtered = trades.filter((t) => {
    const matchTab = tab === 'all' || t.transaction_type === tab;
    const matchSearch = t.symbol?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>

        <button
          onClick={() => fetchTrades({ nextPage: 1, append: false })}
          className="flex gap-2 items-center"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded-lg text-sm
              ${tab === t.key ? 'bg-blue-500/20 text-blue-400' : ''}`}
            style={{padding: '0.25rem'}}
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto relative">
          <Search size={14} className="absolute left-2 top-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1 text-sm rounded bg-[var(--bg-input)]"
            style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}}
            placeholder="Search"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-md overflow-hidden" style={{padding: '0.25rem'}}>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-[var(--text-tertiary)]">
              {['Symbol','Type','Qty','Price','Value','Charges','Net',''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8}><Skeleton className="h-6 w-full" /></td></tr>
                ))
              : filtered.map((t) => (
                  <TradeRow
                    key={t.id}
                    trade={t}
                    onOpenStock={(trade) => navigate(`/stock/${trade.symbol}`)}
                  />
                ))
            }
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fetchTrades({ nextPage: page + 1, append: true })}
            disabled={loadingMore}
            className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]
                       text-sm text-[var(--text-primary)] disabled:opacity-60"
            style={{padding: '0.25rem'}}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Trades;