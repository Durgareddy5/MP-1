import React, { useMemo } from 'react';

const maxQty = (levels = []) => {
  const m = Math.max(0, ...(levels || []).map((l) => Number(l.qty || 0)));
  return Number.isFinite(m) ? m : 0;
};

const Row = ({ side, level, max, onClick }) => {
  const qty = Number(level?.qty || 0);
  const price = Number(level?.price || 0);
  const pct = max > 0 ? Math.min(100, (qty / max) * 100) : 0;

  const bar = side === 'ask'
    ? 'rgba(255, 23, 68, 0.18)'
    : 'rgba(0, 230, 118, 0.18)';

  return (
    <button
      type="button"
      onClick={() => onClick?.(price, side)}
      className="w-full text-left px-3 py-1.5 grid grid-cols-2 gap-2 font-mono text-xs rounded-md hover:bg-[var(--bg-tertiary)] transition-colors relative overflow-hidden"
    >
      <div
        className="absolute inset-y-0"
        style={{
          width: `${pct}%`,
          background: bar,
          left: side === 'bid' ? 0 : 'auto',
          right: side === 'ask' ? 0 : 'auto',
        }}
      />

      <div className={`relative z-10 ${side === 'ask' ? 'text-[var(--loss)]' : 'text-[var(--profit)]'}`}>
        {price ? price.toFixed(2) : '--'}
      </div>
      <div className="relative z-10 text-right text-[var(--text-secondary)]">
        {qty ? qty.toLocaleString('en-IN') : '--'}
      </div>
    </button>
  );
};

const OrderBook = ({ title = 'Order Book', bids = [], asks = [], onPriceSelect }) => {
  const maxBid = useMemo(() => maxQty(bids), [bids]);
  const maxAsk = useMemo(() => maxQty(asks), [asks]);

  const bestBid = useMemo(() => {
    if (!bids?.length) return null;
    return bids.reduce((acc, v) => (Number(v.price) > Number(acc.price) ? v : acc), bids[0]);
  }, [bids]);

  const bestAsk = useMemo(() => {
    if (!asks?.length) return null;
    return asks.reduce((acc, v) => (Number(v.price) < Number(acc.price) ? v : acc), asks[0]);
  }, [asks]);

  const spread = useMemo(() => {
    const b = Number(bestBid?.price);
    const a = Number(bestAsk?.price);
    if (!Number.isFinite(b) || !Number.isFinite(a) || b <= 0 || a <= 0) return null;
    return a - b;
  }, [bestBid, bestAsk]);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden" style={{padding: '0.25rem'}}>
      <div className="px-4 py-3 border-b border-[var(--border-primary)]">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
        <div className="mt-1 grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--text-tertiary)]">
          <div>Price</div>
          <div className="text-right">Qty</div>
        </div>
      </div>

      <div className="p-2 space-y-2">
        <div className="space-y-1">
          {(asks || []).slice().reverse().map((l, idx) => (
            <Row
              key={`ask-${idx}-${l.price}`}
              side="ask"
              level={l}
              max={maxAsk}
              onClick={onPriceSelect}
            />
          ))}
        </div>

        <div className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
          <div className="flex items-center justify-between font-mono text-xs">
            <div className="text-[var(--profit)]">
              {bestBid?.price ? bestBid.price.toFixed(2) : '--'}
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Spread {spread === null ? '--' : spread.toFixed(2)}
            </div>
            <div className="text-[var(--loss)]">
              {bestAsk?.price ? bestAsk.price.toFixed(2) : '--'}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {(bids || []).map((l, idx) => (
            <Row
              key={`bid-${idx}-${l.price}`}
              side="bid"
              level={l}
              max={maxBid}
              onClick={onPriceSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
