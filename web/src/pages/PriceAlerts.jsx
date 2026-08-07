import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, RefreshCw, Plus, Trash2,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import tradingService from '@/services/tradingService';
import Skeleton from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import useMarketStore from '@/store/marketStore';


/* ─── CONDITION MAP ───────────────── */
const CONDITION_MAP = {
  above: 'price_above',
  below: 'price_below',
};

const CONDITION_OPTIONS = [
  { label: 'Price Above', value: 'above' },
  { label: 'Price Below', value: 'below' },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const PriceAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const prices = useMarketStore((s) => s.prices);

  console.log(prices['RELIANCE']?.price);

  const [form, setForm] = useState({
    symbol: '',
    condition: 'above',
    target: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  /* ─── FETCH ALERTS ───────────────── */
  const fetchAlerts = async () => {
  try {
    setLoading(true);

    const res = await tradingService.getAlerts();

    console.log("API RESPONSE:", res); // 👈 check this

    setAlerts(res.data || []);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    toast.error('Failed to fetch alerts');
  } finally {
    setLoading(false);
  }
};

  /* ─── SEARCH STOCKS ───────────────── */
  const handleSearch = async (query) => {
    try {
      if (!query) return setSuggestions([]);

      const res = await tradingService.searchStocks(query);
      setSuggestions(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ─── CREATE ALERT ───────────────── */
  const handleCreate = async () => {
    try {
      if (!form.symbol || !form.target) {
        toast.error('Enter symbol & target');
        return;
      }

      const payload = {
        symbol: form.symbol.toUpperCase().trim(),
        exchange: 'NSE',
        condition: CONDITION_MAP[form.condition],
        target_value: Number(form.target),
      };

      await tradingService.createAlert(payload);

      toast.success('Alert created');

      setForm({ symbol: '', condition: 'above', target: '' });
      setSelectedStock(null);
      setSuggestions([]);
      setShowModal(false);

      fetchAlerts();
    } catch (err) {
      toast.error(err.message || 'Create failed');
    }
  };

  /* ─── DELETE ───────────────── */
  const handleDelete = async (id) => {
    await tradingService.deleteAlert(id);
    fetchAlerts();
  };

  /* ─── TOGGLE ───────────────── */
  const handleToggle = async (id) => {
    await tradingService.toggleAlert(id);
    fetchAlerts();
  };

  /* ─── FILTER ───────────────── */
  const filtered = alerts.filter((a) => {
    if (filter === 'active') return a.is_active;
    if (filter === 'inactive') return !a.is_active;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
            Price Alerts
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Get notified when price conditions are met
          </p>
        </div>



        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-[var(--accent-primary)] text-white text-sm font-semibold"
            style={{padding: '0.25rem'}}
            >
            <Plus size={16}/> Add Alert
          </button>

          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-[var(--bg-card)]
                       border border-[var(--border-primary)]"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium
              ${filter === f.key
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm text-[var(--text-tertiary)]">
            No alerts created yet
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg
                         bg-[var(--bg-card)]
                         border border-[var(--border-primary)]
                         hover:border-[var(--border-secondary)]"
              style={{padding: '0.25rem'}}>
              <div>
                <p className="font-semibold">{alert.symbol}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {alert.condition.replace('_', ' ')} ₹{alert.target_value}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold
                  ${alert.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                  {alert.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <button onClick={() => handleToggle(alert.id)}>
                  {alert.is_active ? <ToggleRight/> : <ToggleLeft/>}
                </button>

                <button onClick={() => handleDelete(alert.id)}>
                  <Trash2/>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

    <div className="w-full max-w-lg bg-[var(--bg-card)]
                    border border-[var(--border-primary)]
                    rounded-xl shadow-xl p-6 space-y-5" style={{padding: '0.25rem'}}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Create Price Alert
        </h2>

        <button
          onClick={() => setShowModal(false)}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">

        {/* SYMBOL SEARCH */}
        <div className="relative">
          <label className="text-xs text-[var(--text-tertiary)]">
            Stock
          </label>

          <input
            value={form.symbol}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, symbol: val });
              handleSearch(val);
            }}
            placeholder="Search (e.g. RELIANCE)"
            className="w-full mt-1 px-3 py-2 rounded-lg
                       bg-[var(--bg-input)]
                       border border-[var(--border-primary)]
                       text-[var(--text-primary)]
                       focus:outline-none focus:border-[var(--accent-primary)]"
          />

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto
                            bg-[var(--bg-card)]
                            border border-[var(--border-primary)]
                            rounded-lg shadow-lg">
              {suggestions.map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => {
                    setForm({ ...form, symbol: s.symbol });
                    setSelectedStock(s);
                    setSuggestions([]);
                    fetchPrice(s.symbol);
                  }}
                  className="px-3 py-2 text-sm cursor-pointer
                             hover:bg-[var(--bg-card-hover)]"
                >
                  {s.symbol} - {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONDITION + TARGET */}
        <div className="grid grid-cols-2 gap-3">

          {/* CONDITION */}
          <div>
            <label className="text-xs text-[var(--text-tertiary)]">
              Condition
            </label>

            <select
              value={form.condition}
              onChange={(e) =>
                setForm({ ...form, condition: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 rounded-lg
                         bg-[var(--bg-input)]
                         border border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* TARGET */}
          <div>
            <label className="text-xs text-[var(--text-tertiary)]">
              Target Price
            </label>

            <input
              type="number"
              value={form.target}
              onChange={(e) =>
                setForm({ ...form, target: e.target.value })
              }
              placeholder="Enter price"
              className="w-full mt-1 px-3 py-2 rounded-lg
                         bg-[var(--bg-input)]
                         border border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

        </div>

        {/* Live Price */}
        {selectedStock && (
          <p className="text-xs text-green-400">
            Selected: {selectedStock.symbol}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg border
                       border-[var(--border-primary)]
                       text-[var(--text-secondary)]"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg
                       bg-[var(--accent-primary)]
                       text-white font-medium"
          >
            Create Alert
          </button>
        </div>

      </div>
    </div>
  </div>
   )}

    </div>
  );
};

export default PriceAlerts;