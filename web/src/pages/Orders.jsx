import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Filter, RefreshCw, Search,
  ChevronDown, X, TrendingUp, TrendingDown,
  Clock, CheckCircle2, XCircle, AlertCircle,
  Eye, Download,
} from 'lucide-react';
import { formatINR, formatDate, getPnLColor } from '@/utils/formatters';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

const TABS = [
  { key: 'all',      label: 'All Orders',  count: 24 },
  { key: 'open',     label: 'Open',        count: 3  },
  { key: 'filled',   label: 'Executed',    count: 18 },
  { key: 'pending',  label: 'Pending',     count: 2  },
  { key: 'cancelled',label: 'Cancelled',   count: 1  },
];

/* Mock orders */
const MOCK_ORDERS = [
  { id: '1', order_number: 'ORD-20250402-84721', symbol: 'RELIANCE',
    stock_name: 'Reliance Industries Ltd', exchange: 'NSE',
    transaction_type: 'buy', order_type: 'market', product_type: 'CNC',
    quantity: 50, filled_quantity: 50, average_price: 1285.50,
    total_value: 64275, total_charges: 128.55,
    status: 'filled', validity: 'DAY',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    executed_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '2', order_number: 'ORD-20250402-84722', symbol: 'TCS',
    stock_name: 'Tata Consultancy Services Ltd', exchange: 'NSE',
    transaction_type: 'sell', order_type: 'limit', product_type: 'CNC',
    quantity: 20, filled_quantity: 20, price: 3600.00, average_price: 3598.50,
    total_value: 71970, total_charges: 143.94,
    status: 'filled', validity: 'DAY',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    executed_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: '3', order_number: 'ORD-20250402-84723', symbol: 'HDFCBANK',
    stock_name: 'HDFC Bank Ltd', exchange: 'NSE',
    transaction_type: 'buy', order_type: 'limit', product_type: 'CNC',
    quantity: 100, filled_quantity: 0, price: 1650.00,
    total_value: 165000, total_charges: 0,
    status: 'open', validity: 'DAY',
    created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: '4', order_number: 'ORD-20250402-84724', symbol: 'INFY',
    stock_name: 'Infosys Ltd', exchange: 'NSE',
    transaction_type: 'buy', order_type: 'stop_loss', product_type: 'MIS',
    quantity: 200, filled_quantity: 0, price: 1500.00, trigger_price: 1490.00,
    total_value: 300000, total_charges: 0,
    status: 'pending', validity: 'DAY',
    created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: '5', order_number: 'ORD-20250401-83991', symbol: 'WIPRO',
    stock_name: 'Wipro Ltd', exchange: 'NSE',
    transaction_type: 'buy', order_type: 'limit', product_type: 'CNC',
    quantity: 300, filled_quantity: 0, price: 460.00,
    status: 'cancelled', validity: 'DAY',
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    cancelled_at: new Date(Date.now() - 25 * 3600000).toISOString() },
];

const statusConfig = {
  filled:    { icon: CheckCircle2, color: 'var(--profit)', badge: 'filled' },
  open:      { icon: Clock,        color: 'var(--info)',   badge: 'open'   },
  pending:   { icon: AlertCircle,  color: 'var(--warning)',badge: 'pending'},
  cancelled: { icon: XCircle,      color: 'var(--text-tertiary)', badge: 'cancelled' },
  rejected:  { icon: XCircle,      color: 'var(--loss)',   badge: 'rejected'},
};

const OrderRow = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <>
      <motion.tr
        onClick={() => setExpanded(!expanded)}
        className="border-b border-[var(--border-primary)] cursor-pointer
                   hover:bg-[var(--bg-card-hover)] transition-colors duration-150"
        layout
      >
        {/* Order # */}
        <td className="px-4 py-3">
          <p className="text-xs font-mono text-[var(--text-tertiary)]">
            {order.order_number}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {formatDate(order.created_at, 'datetime')}
          </p>
        </td>

        {/* Symbol */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center
                            text-xs font-bold
                            ${order.transaction_type === 'buy'
                              ? 'bg-[#0052FF]/10 text-[#0052FF]'
                              : 'bg-[var(--loss)]/10 text-[var(--loss)]'}`}>
              {order.symbol[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {order.symbol}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">{order.exchange}</p>
            </div>
          </div>
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px]
                             font-bold uppercase tracking-wide w-fit
                             ${order.transaction_type === 'buy'
                               ? 'bg-[#0052FF]/10 text-[#0052FF]'
                               : 'bg-[var(--loss)]/10 text-[var(--loss)]'}`}>
              {order.transaction_type}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">
              {order.order_type.replace('_', ' ')}
            </span>
          </div>
        </td>

        {/* Product */}
        <td className="px-4 py-3">
          <Badge variant={order.product_type} size="xs">
            {order.product_type}
          </Badge>
        </td>

        {/* Qty */}
        <td className="px-4 py-3 text-right">
          <p className="text-sm font-mono text-[var(--text-primary)]">
            {order.filled_quantity}/{order.quantity}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">filled/total</p>
        </td>

        {/* Price */}
        <td className="px-4 py-3 text-right">
          <p className="text-sm font-mono text-[var(--text-primary)]">
            {order.average_price
              ? formatINR(order.average_price)
              : order.price
                ? formatINR(order.price)
                : 'Market'}
          </p>
          {order.trigger_price && (
            <p className="text-xs font-mono text-[var(--warning)]">
              Trig: {formatINR(order.trigger_price)}
            </p>
          )}
        </td>

        {/* Value */}
        <td className="px-4 py-3 text-right">
          <p className="text-sm font-mono text-[var(--text-primary)]">
            {order.total_value ? formatINR(order.total_value) : '—'}
          </p>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <StatusIcon size={14} style={{ color: cfg.color }} />
            <Badge variant={cfg.badge} size="xs" dot>
              {order.status}
            </Badge>
          </div>
        </td>

        {/* Expand */}
        <td className="px-4 py-3 text-center">
          <ChevronDown
            size={16}
            className={`text-[var(--text-tertiary)] transition-transform duration-200
                        ${expanded ? 'rotate-180' : ''}`}
          />
        </td>
      </motion.tr>

      {/* Expanded detail row */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={9}
                className="px-6 py-4 bg-[var(--bg-secondary)]
                           border-b border-[var(--border-primary)]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Validity',   value: order.validity },
                  { label: 'Brokerage',  value: formatINR(order.total_charges || 0) },
                  { label: 'Executed At',
                    value: order.executed_at
                      ? formatDate(order.executed_at, 'datetime') : '—' },
                  { label: 'Net Amount',
                    value: order.total_value
                      ? formatINR(
                          order.transaction_type === 'buy'
                            ? order.total_value + (order.total_charges || 0)
                            : order.total_value - (order.total_charges || 0)
                        )
                      : '—' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] uppercase tracking-wider
                                  text-[var(--text-tertiary)] mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-mono font-medium
                                  text-[var(--text-primary)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

const Orders = () => {
  const [activeTab,  setActiveTab]  = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [orders,     setOrders]     = useState([]);
  const [searchQ,    setSearchQ]    = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(MOCK_ORDERS);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const filtered = orders.filter((o) => {
    const matchTab =
      activeTab === 'all' ? true : o.status === activeTab;
    const matchSearch = searchQ
      ? o.symbol.toLowerCase().includes(searchQ.toLowerCase()) ||
        o.order_number.toLowerCase().includes(searchQ.toLowerCase())
      : true;
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
            Orders
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage and track all your paper trading orders
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl
                             bg-[var(--bg-card)] border border-[var(--border-primary)]
                             text-sm text-[var(--text-secondary)]
                             hover:border-[var(--border-secondary)]
                             transition-all duration-200">
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => { setLoading(true);
              setTimeout(() => { setOrders(MOCK_ORDERS); setLoading(false); }, 700); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-[var(--bg-card)] border border-[var(--border-primary)]
                       text-sm text-[var(--text-secondary)]
                       hover:border-[var(--border-secondary)]
                       transition-all duration-200"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                      rounded-md overflow-hidden" style={{padding: '0.25rem'}}>
        {/* Tabs */}
        <div className="flex items-center gap-4 px-4 py-3
                        border-b border-[var(--border-primary)]
                        overflow-x-auto scrollbar-none" style={{marginBottom: '1rem'}}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md
                         text-sm font-medium whitespace-nowrap transition-all duration-200
                         ${activeTab === tab.key
                           ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                           : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                         }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold
                               ${activeTab === tab.key
                                 ? 'bg-[var(--accent-primary)] text-white'
                                 : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                {tab.count}
              </span>
            </button>
          ))}

          {/* Search */}
          <div className="ml-auto relative flex-shrink-0">
            <Search size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2
                         text-[var(--text-tertiary)]" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search orders..."
              className="pl-8 pr-4 py-1.5 rounded-lg text-sm
                         bg-[var(--bg-input)] border border-[var(--border-primary)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                         focus:outline-none focus:border-[var(--accent-primary)]
                         w-44 transition-all duration-200"
              style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-secondary)]
                             border-b border-[var(--border-primary)]">
                {['Order ID', 'Symbol', 'Type', 'Product',
                  'Qty', 'Price', 'Value', 'Status', ''].map((h) => (
                  <th key={h}
                      className={`px-4 py-3 text-[10px] font-bold uppercase
                                 tracking-[0.08em] text-[var(--text-tertiary)]
                                 ${['Qty','Price','Value'].includes(h)
                                   ? 'text-right' : 'text-left'}`}>
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
                      {[...Array(9)].map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.length > 0
                  ? filtered.map((o) => <OrderRow key={o.id} order={o} />)
                  : (
                    <tr>
                      <td colSpan={9}
                          className="px-4 py-16 text-center">
                        <ShoppingCart size={40}
                          className="text-[var(--text-tertiary)] mx-auto mb-3" />
                        <p className="text-sm text-[var(--text-tertiary)]">
                          No orders found
                        </p>
                      </td>
                    </tr>
                  )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;