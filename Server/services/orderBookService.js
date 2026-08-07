const DEFAULT_LEVELS = 10;

const roundTo = (value, step) => {
  const v = Number(value);
  const s = Number(step);
  if (!Number.isFinite(v) || !Number.isFinite(s) || s <= 0) return v;
  return Math.round(v / s) * s;
};

const toQty = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sortDesc = (a, b) => b - a;
const sortAsc = (a, b) => a - b;

class OrderBookService {
  constructor() {
    this.books = new Map();
    this.lastEmitHash = new Map();
    this.lastEmitAt = new Map();
  }

  getBook(symbol) {
    if (!symbol) return null;
    const key = String(symbol);
    if (!this.books.has(key)) {
      this.books.set(key, {
        symbol: key,
        bids: new Map(),
        asks: new Map(),
        updatedAt: Date.now(),
      });
    }
    return this.books.get(key);
  }

  setLevel(symbol, side, price, qty) {
    const book = this.getBook(symbol);
    if (!book) return null;

    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return null;

    const q = Math.max(0, toQty(qty, 0));
    const map = side === 'ask' ? book.asks : book.bids;

    if (q <= 0) {
      map.delete(p);
    } else {
      map.set(p, q);
    }

    book.updatedAt = Date.now();
    return book;
  }

  getTop(symbol, levels = DEFAULT_LEVELS) {
    const book = this.getBook(symbol);
    if (!book) return { bids: [], asks: [] };

    const bids = [...book.bids.entries()]
      .sort((a, b) => sortDesc(a[0], b[0]))
      .slice(0, levels)
      .map(([price, qty]) => ({ price, qty }));

    const asks = [...book.asks.entries()]
      .sort((a, b) => sortAsc(a[0], b[0]))
      .slice(0, levels)
      .map(([price, qty]) => ({ price, qty }));

    return { bids, asks, updatedAt: book.updatedAt };
  }

  ingestL2Snapshot(symbol, payload = {}) {
    const book = this.getBook(symbol);
    if (!book) return null;

    book.bids.clear();
    book.asks.clear();

    (payload.bids || []).forEach((l) => {
      const p = Number(l.price);
      const q = Number(l.qty ?? l.quantity);
      if (Number.isFinite(p) && p > 0 && Number.isFinite(q) && q > 0) {
        book.bids.set(p, q);
      }
    });

    (payload.asks || []).forEach((l) => {
      const p = Number(l.price);
      const q = Number(l.qty ?? l.quantity);
      if (Number.isFinite(p) && p > 0 && Number.isFinite(q) && q > 0) {
        book.asks.set(p, q);
      }
    });

    book.updatedAt = Date.now();
    return book;
  }

  ingestTick(tick) {
    const symbol = tick?.symbol;
    const price = Number(tick?.price);
    if (!symbol || !Number.isFinite(price) || price <= 0) return null;

    const book = this.getBook(symbol);
    if (!book) return null;

    const step = price > 5000 ? 1 : price > 1000 ? 0.5 : price > 100 ? 0.1 : 0.05;
    const mid = roundTo(price, step);
    const spreadSteps = price > 5000 ? 2 : price > 1000 ? 2 : price > 100 ? 3 : 4;

    const bestBid = roundTo(mid - spreadSteps * step, step);
    const bestAsk = roundTo(mid + spreadSteps * step, step);

    const nowSec = Math.floor(Date.now() / 1000);

    const ensure = (map, p, q) => {
      if (!map.has(p)) map.set(p, q);
    };

    const nextQty = (prevQty, level, side) => {
      const prev = Math.max(1, toQty(prevQty, 1));
      const base = Math.max(1, (DEFAULT_LEVELS + 1 - level) * 120);
      const wave = (nowSec % 7) * 13;
      const bias = side === 'bid' ? 0 : 20;
      const target = base + wave + bias + (level * 9);
      const noise = ((nowSec + level * 17) % 11) - 5;
      const raw = target + noise * 12;
      const alpha = 0.35;
      return Math.max(1, Math.round(prev * (1 - alpha) + raw * alpha));
    };

    for (let i = 0; i < DEFAULT_LEVELS; i += 1) {
      const level = i + 1;
      const bidP = roundTo(bestBid - i * step, step);
      const askP = roundTo(bestAsk + i * step, step);

      ensure(book.bids, bidP, (DEFAULT_LEVELS + 1 - level) * 100);
      ensure(book.asks, askP, (DEFAULT_LEVELS + 1 - level) * 100);

      book.bids.set(bidP, nextQty(book.bids.get(bidP), level, 'bid'));
      book.asks.set(askP, nextQty(book.asks.get(askP), level, 'ask'));
    }

    const prune = (map, best, dir) => {
      const keepMin = best - dir * (DEFAULT_LEVELS + 3) * step;
      const keepMax = best + dir * (DEFAULT_LEVELS + 3) * step;

      [...map.keys()].forEach((p) => {
        if (dir < 0) {
          if (p > best || p < keepMin) map.delete(p);
        } else {
          if (p < best || p > keepMax) map.delete(p);
        }
      });
    };

    prune(book.bids, bestBid, -1);
    prune(book.asks, bestAsk, 1);

    book.updatedAt = Date.now();
    return book;
  }

  shouldEmit(symbol, top) {
    const now = Date.now();
    const lastAt = this.lastEmitAt.get(symbol) || 0;
    if (now - lastAt < 180) return false;

    const hash = JSON.stringify(top);
    const prev = this.lastEmitHash.get(symbol);
    if (prev === hash) return false;
    this.lastEmitHash.set(symbol, hash);
    this.lastEmitAt.set(symbol, now);
    return true;
  }
}

const orderBookService = new OrderBookService();

export default orderBookService;
