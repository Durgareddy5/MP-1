import { Server } from 'socket.io';
import env from '../config/environment.js';
import { startYahooStream, addSymbols } from './yahooService.js';
import orderBookService from './orderBookService.js';
import { getMarketStatus } from '../utils/helpers.js';

let io;
const clientSubscriptions = new Map();

// 🔥 Convert symbols → Yahoo format
const normalize = (symbol = '') => {
  const s = symbol.toUpperCase();

  if (s === 'NIFTY 50') return '^NSEI';
  if (s === 'NIFTY BANK') return '^NSEBANK';
  if (s === 'SENSEX') return '^BSESN';
  if (s === 'INDIA VIX') return '^INDIAVIX';

  if (s === 'NIFTY 100') return '^CNX100';
  if (s === 'NIFTY 500') return '^CRSLDX';
  if (s === 'NIFTY IT') return '^CNXIT';
  if (s === 'NIFTY PHARMA') return '^CNXPHARMA';
  if (s === 'NIFTY AUTO') return '^CNXAUTO';
  if (s === 'NIFTY FMCG') return '^CNXFMCG';
  if (s === 'NIFTY METAL') return '^CNXMETAL';
  if (s === 'NIFTY REALTY') return '^CNXREALTY';
  if (s === 'NIFTY ENERGY') return '^CNXENERGY';
  if (s === 'NIFTY INFRA') return '^CNXINFRA';
  if (s === 'NIFTY PSU BANK') return '^CNXPSUBANK';
  if (s === 'NIFTY MIDCAP 50') return '^NSEMDCP50';
  if (s === 'NIFTY NEXT 50') return '^NSMIDCP';
  if (s === 'NIFTY SMALLCAP 100') return '^CNXSC';

  if (s.includes('.NS') || s.startsWith('^')) return s;

  return `${s}.NS`;
};

const ensureClient = (id) => {
  if (!clientSubscriptions.has(id)) {
    clientSubscriptions.set(id, new Set());
  }
  return clientSubscriptions.get(id);
};

const recomputeAll = () => {
  const all = new Set();
  clientSubscriptions.forEach((set) => {
    set.forEach((s) => all.add(s));
  });
  return [...all];
};

const sync = () => {
  addSymbols(recomputeAll());
};

const subscribe = (socket, payload = {}) => {
  const state = ensureClient(socket.id);

  const symbols = [
    ...(payload.symbols || []),
    ...(payload.indices || []),
  ];

  symbols.map(normalize).forEach((s) => state.add(s));

  sync();

  socket.emit('market:subscribed', {
    symbols: [...state],
  });
};

const unsubscribe = (socket, payload = {}) => {
  const state = ensureClient(socket.id);

  const symbols = [
    ...(payload.symbols || []),
    ...(payload.indices || []),
  ];

  symbols.map(normalize).forEach((s) => state.delete(s));

  sync();

  socket.emit('market:subscribed', {
    symbols: [...state],
  });
};

export const initMarketSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: String(env.CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      credentials: true,
    },
  });

  // 🔥 Start stream
  startYahooStream((tick) => {
    io.emit('market:tick', tick);

    const status = getMarketStatus()?.status;
    const marketOpen = status === 'open' || status === 'pre_open';
    if (!marketOpen) return;

    const book = orderBookService.ingestTick(tick);
    if (!book) return;

    const top = orderBookService.getTop(book.symbol, 10);
    if (!orderBookService.shouldEmit(book.symbol, top)) return;

    io.emit('market:orderbook', {
      symbol: book.symbol,
      bids: top.bids,
      asks: top.asks,
      updatedAt: top.updatedAt,
    });
  });

  io.on('connection', (socket) => {
    ensureClient(socket.id);

    socket.emit('market:status', {
      connected: true,
      provider: 'yahoo',
    });

    socket.on('market:subscribe', (payload) => {
  console.log('SUBSCRIBE PAYLOAD:', payload); // 👈 ADD
  subscribe(socket, payload);
});

    socket.on('market:unsubscribe', (payload) => {
      unsubscribe(socket, payload);
    });

    socket.on('disconnect', () => {
      clientSubscriptions.delete(socket.id);
      sync();
    });
  });

  return io;
};