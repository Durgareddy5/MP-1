import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowUpCircle, ArrowDownCircle,
  IndianRupee, RefreshCw, TrendingUp, Clock,
  CheckCircle2, XCircle, AlertCircle, CreditCard,
  ChevronDown,
} from 'lucide-react';
import { formatINR, formatDate } from '@/utils/formatters';
import Skeleton from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import tradingService from '@/services/tradingService';

const QUICK_AMOUNTS = [100000, 500000, 1000000, 5000000];

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'deposit',    amount: 5000000, credit_debit: 'credit',
    balance_after: 10000000, description: 'Initial virtual fund allocation',
    status: 'completed', created_at: new Date(Date.now() - 7*86400000).toISOString() },
  { id: '2', type: 'buy_debit',  amount: 64275, credit_debit: 'debit',
    balance_after: 9935725, description: 'BUY 50 RELIANCE @ 1285.50',
    status: 'completed', created_at: new Date(Date.now() - 2*3600000).toISOString() },
  { id: '3', type: 'sell_credit',amount: 71970, credit_debit: 'credit',
    balance_after: 10007695, description: 'SELL 20 TCS @ 3598.50',
    status: 'completed', created_at: new Date(Date.now() - 5*3600000).toISOString() },
  { id: '4', type: 'brokerage_debit', amount: 20, credit_debit: 'debit',
    balance_after: 10007675, description: 'Brokerage charges - ORD-20250402-84722',
    status: 'completed', created_at: new Date(Date.now() - 5*3600000 - 1000).toISOString() },
  { id: '5', type: 'deposit',    amount: 2000000, credit_debit: 'credit',
    balance_after: 12007675, description: 'Fund top-up',
    status: 'completed', created_at: new Date(Date.now() - 3*86400000).toISOString() },
  { id: '6', type: 'withdrawal', amount: 1000000, credit_debit: 'debit',
    balance_after: 11007675, description: 'Partial withdrawal',
    status: 'completed', created_at: new Date(Date.now() - 1*86400000).toISOString() },
];

const txTypeConfig = {
  deposit:        { icon: ArrowUpCircle,   color: 'text-[var(--profit)]', label: 'Deposit' },
  withdrawal:     { icon: ArrowDownCircle, color: 'text-[var(--loss)]',   label: 'Withdrawal' },
  buy_debit:      { icon: ArrowDownCircle, color: 'text-[var(--loss)]',   label: 'Buy Debit' },
  sell_credit:    { icon: ArrowUpCircle,   color: 'text-[var(--profit)]', label: 'Sell Credit' },
  brokerage_debit:{ icon: CreditCard,      color: 'text-[var(--warning)]',label: 'Brokerage' },
  order_blocked:  { icon: Clock,           color: 'text-[var(--warning)]',label: 'Blocked' },
  order_released: { icon: CheckCircle2,    color: 'text-[var(--profit)]', label: 'Released' },
  initial_credit: { icon: ArrowUpCircle,   color: 'text-[var(--profit)]', label: 'Initial Credit' },
};

const Funds = () => {
  const [funds,        setFunds]        = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeAction, setActiveAction] = useState(null); // 'deposit' | 'withdraw'
  const [amount,       setAmount]       = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [fundsRes, txRes] = await Promise.all([
          tradingService.getFunds(),
          tradingService.getFundTransactions({ limit: 50, page: 1 }),
        ]);
        setFunds(fundsRes?.data || null);
        setTransactions(txRes?.data || []);
      } catch (err) {
        toast.error(err?.message || 'Failed to load funds');
        setFunds(null);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAction = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amt < 10000) {
      toast.error('Minimum amount is ₹10,000');
      return;
    }
    if (activeAction === 'withdraw' && amt > funds.available_balance) {
      toast.error('Insufficient available balance');
      return;
    }

    try {
      setSubmitting(true);
      if (activeAction === 'deposit') {
        const res = await tradingService.addFunds(amt);
        setFunds(res?.data?.fund || res?.data?.funds || res?.data?.fund || funds);
        toast.success(res?.message || `₹${amt.toLocaleString('en-IN')} added successfully!`);
      } else {
        const res = await tradingService.withdrawFunds(amt);
        setFunds(res?.data?.fund || res?.data?.funds || res?.data?.fund || funds);
        toast.success(res?.message || `₹${amt.toLocaleString('en-IN')} withdrawn successfully!`);
      }

      const txRes = await tradingService.getFundTransactions({ limit: 50, page: 1 });
      setTransactions(txRes?.data || []);

      setAmount('');
      setActiveAction(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to update funds');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
          Funds
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your virtual trading capital
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </>
        ) : (
          <>
            {/* Available Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative rounded-md p-6 overflow-hidden
                         bg-gradient-to-br from-[#0052FF]/15 to-[#7C3AED]/10
                         border border-[#0052FF]/20"
              style={{padding: '0.25rem',marginTop: '0.5rem',marginBottom: '0.5rem'}}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full
                              bg-[#0052FF] opacity-5 blur-2xl -translate-y-1/2
                              translate-x-1/2" />
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={18} className="text-[var(--accent-primary)]" />
                <span className="text-xs font-medium uppercase tracking-wider
                                 text-[var(--text-secondary)]">
                  Available Balance
                </span>
              </div>
              <p className="text-3xl font-heading font-bold
                            text-[var(--text-primary)] mb-1">
                {formatINR(funds.available_balance, { compact: true })}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono">
                {formatINR(funds.available_balance)}
              </p>
            </motion.div>

            {/* Used Margin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-md p-6 bg-[var(--bg-card)]
                         border border-[var(--border-primary)]"
              style={{padding: '0.25rem',marginTop: '0.5rem', marginBottom: '0.5rem'}}
            >
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee size={18} className="text-[var(--warning)]" />
                <span className="text-xs font-medium uppercase tracking-wider
                                 text-[var(--text-secondary)]">
                  Margin Used / Blocked
                </span>
              </div>
              <p className="text-2xl font-heading font-bold
                            text-[var(--text-primary)] mb-1">
                {formatINR(funds.used_margin + funds.blocked_amount, { compact: true })}
              </p>
              <div className="flex gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Margin Used
                  </p>
                  <p className="text-xs font-mono text-[var(--warning)]">
                    {formatINR(funds.used_margin, { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Order Blocked
                  </p>
                  <p className="text-xs font-mono text-[var(--warning)]">
                    {formatINR(funds.blocked_amount, { compact: true })}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* P&L */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-md p-6 bg-[var(--bg-card)]
                         border border-[var(--border-primary)]"
              style={{padding: '0.25rem',marginTop: '0.5rem',marginBottom: '0.5rem'}}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-[var(--profit)]" />
                <span className="text-xs font-medium uppercase tracking-wider
                                 text-[var(--text-secondary)]">
                  Overall P&L
                </span>
              </div>
              <p className="text-2xl font-heading font-bold
                            text-[var(--profit)] mb-1">
                +{formatINR(funds.realized_pnl + funds.unrealized_pnl, { compact: true })}
              </p>
              <div className="flex gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)]">Realized</p>
                  <p className="text-xs font-mono text-[var(--profit)]">
                    +{formatINR(funds.realized_pnl, { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)]">Unrealized</p>
                  <p className="text-xs font-mono text-[var(--profit)]">
                    +{formatINR(funds.unrealized_pnl, { compact: true })}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3" style={{marginBottom: '0.5rem'}}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveAction(activeAction === 'deposit' ? null : 'deposit')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg
                     font-semibold text-sm text-white
                     bg-[var(--profit)] hover:brightness-110
                     shadow-[0_0_20px_rgba(0,230,118,0.2)]
                     transition-all duration-200"
          style={{padding: '0.25rem'}}
        >
          <ArrowUpCircle size={18} /> Add Funds
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveAction(activeAction === 'withdraw' ? null : 'withdraw')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg
                     font-semibold text-sm text-[var(--text-primary)]
                     bg-[var(--bg-card)] border border-[var(--border-primary)]
                     hover:border-[var(--border-secondary)]
                     transition-all duration-200"
          style={{padding: '0.25rem'}}
        >
          <ArrowDownCircle size={18} /> Withdraw
        </motion.button>
      </div>

      {/* Deposit / Withdraw Panel */}
      <AnimatePresence>
        {activeAction && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                            rounded-md p-6" style={{padding: '0.25rem',marginBottom: '0.5rem'}}>
              <h3 className="text-base font-heading font-semibold
                             text-[var(--text-primary)] mb-4" style={{marginBottom: '0.5rem'}}>
                {activeAction === 'deposit' ? '💰 Add Virtual Funds' : '💸 Withdraw Funds'}
              </h3>

              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold
                               border transition-all duration-200
                               ${amount === String(a)
                                 ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                 : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'}`}
                    style={{marginBottom: '0.5rem'}}
                  >
                    {formatINR(a, { compact: true })}
                  </button>
                ))}
              </div>

              <div className="flex gap-3" style={{marginBottom: '0.5rem'}}>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2
                                   text-sm font-semibold text-[var(--text-tertiary)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="10000"
                    className="w-full pl-8 pr-4 py-3 rounded-xl text-sm font-mono
                               bg-[var(--bg-input)] border border-[var(--border-primary)]
                               text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                               focus:outline-none focus:border-[var(--accent-primary)]
                               focus:ring-2 focus:ring-[var(--accent-primary)]/20
                               transition-all duration-200"
                    style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  onClick={handleAction}
                  disabled={submitting}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200
                             ${activeAction === 'deposit'
                               ? 'bg-[var(--profit)] text-[#09090b]'
                               : 'bg-[var(--loss)] text-white'}`}
                  style={{padding: '0.25rem'}}
                >
                  {submitting ? 'Processing...' : 'Confirm'}
                </motion.button>
                <button
                  onClick={() => { setActiveAction(null); setAmount(''); }}
                  className="p-3 rounded-3xl bg-[var(--bg-tertiary)]
                             text-[var(--text-tertiary)]
                             hover:text-[var(--text-primary)]
                             border border-[var(--border-primary)]
                             transition-all duration-200"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Minimum amount: ₹10,000 · Maximum: ₹10 Crore per transaction
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction History */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                      rounded-md overflow-hidden" style={{padding: '0.25rem'}}>
        <div className="px-5 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-sm font-heading font-semibold
                         text-[var(--text-primary)]">
            Transaction Ledger
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-secondary)]
                             border-b border-[var(--border-primary)]">
                {['Date', 'Type', 'Description', 'Amount',
                  'Balance After', 'Status'].map((h) => (
                  <th key={h}
                      className={`px-5 py-3 text-[10px] font-bold uppercase
                                 tracking-[0.08em] text-[var(--text-tertiary)]
                                 ${['Amount','Balance After'].includes(h)
                                   ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}
                        className="border-b border-[var(--border-primary)]">
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : transactions.map((tx) => {
                    const cfg = txTypeConfig[tx.type] || txTypeConfig.deposit;
                    const TxIcon = cfg.icon;
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-[var(--border-primary)]
                                   hover:bg-[var(--bg-card-hover)]
                                   transition-colors duration-150"
                      >
                        <td className="px-5 py-3 text-xs font-mono
                                       text-[var(--text-tertiary)]">
                          {formatDate(tx.created_at, 'datetime')}
                        </td>
                        <td className="px-5 py-3">
                          <div className={`flex items-center gap-1.5 text-xs
                                          font-medium ${cfg.color}`}>
                            <TxIcon size={14} />
                            {cfg.label}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs
                                       text-[var(--text-secondary)] max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className={`px-5 py-3 text-right text-sm font-mono
                                        font-semibold
                                        ${tx.credit_debit === 'credit'
                                          ? 'text-[var(--profit)]'
                                          : 'text-[var(--loss)]'}`}>
                          {tx.credit_debit === 'credit' ? '+' : '-'}
                          {formatINR(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-mono
                                       text-[var(--text-primary)]" >
                          {formatINR(tx.balance_after)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1 text-xs
                                           text-[var(--profit)]" style={{marginLeft: '0.25rem'}}>
                            <CheckCircle2 size={12} />
                            {tx.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Funds;