import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useMarketStore from '@/store/marketStore';

const DEFAULT_CONTEXT_SYMBOLS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'SBIN',
  'ITC',
  'BHARTIARTL',
  'AXISBANK',
  'HCLTECH',
];

const best = (levels = [], side) => {
  if (!Array.isArray(levels) || !levels.length) return null;
  const sorted = [...levels].sort((a, b) => Number(a.price) - Number(b.price));
  return side === 'bid' ? sorted[sorted.length - 1] : sorted[0];
};

const MiniCard = ({ symbol, book, onOpen }) => {
  const bid = best(book?.bids, 'bid');
  const ask = best(book?.asks, 'ask');

  return (
    <button
      type="button"
      onClick={() => onOpen(symbol)}
      className="w-full text-left px-3 py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-secondary)] transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-[var(--text-primary)]">{symbol}</div>
        <div className="text-[10px] font-mono text-[var(--text-tertiary)]">L2</div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
        <div className="text-[var(--profit)]">
          {bid?.price ? bid.price.toFixed(2) : '--'}
          <span className="ml-2 text-[10px] text-[var(--text-tertiary)]">
            {bid?.qty ? bid.qty.toLocaleString('en-IN') : '--'}
          </span>
        </div>
        <div className="text-right text-[var(--loss)]">
          {ask?.price ? ask.price.toFixed(2) : '--'}
          <span className="ml-2 text-[10px] text-[var(--text-tertiary)]">
            {ask?.qty ? ask.qty.toLocaleString('en-IN') : '--'}
          </span>
        </div>
      </div>
    </button>
  );
};

const MiniOrderBookSidebar = ({ symbols = DEFAULT_CONTEXT_SYMBOLS, currentSymbol }) => {
  const navigate = useNavigate();
  const orderBooksByKey = useMarketStore((s) => s.orderBooksByKey);

  const items = useMemo(() => (
    (symbols || [])
      .filter(Boolean)
      .map((s) => String(s).toUpperCase())
      .filter((s) => !currentSymbol || s !== String(currentSymbol).toUpperCase())
      .slice(0, 8)
  ), [symbols, currentSymbol]);

  const open = (sym) => navigate(`/stock/${sym}`);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-[var(--text-secondary)]">Market Depth (Context)</div>
      <div className="space-y-2">
        {items.map((sym) => (
          <MiniCard
            key={sym}
            symbol={sym}
            book={orderBooksByKey?.[sym]}
            onOpen={open}
          />
        ))}
      </div>
    </div>
  );
};

export default MiniOrderBookSidebar;
