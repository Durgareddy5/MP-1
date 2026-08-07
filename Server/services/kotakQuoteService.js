import env from '../config/environment.js';
import authService from './kotakAuthService.js';
import { getJson } from './kotakHttpClient.js';
import instrumentService from './kotakInstrumentService.js';

const QUOTES_BASE_PATH = '/script-details/1.0/quotes/neosymbol';

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeQuote = (raw) => ({
  exchange: raw.exchange || '',
  exchange_token: raw.exchange_token || '',
  display_symbol: raw.display_symbol || '',
  last_updated: raw.lstup_time ? Number(raw.lstup_time) : Date.now(),
  ltp: toNumber(raw.ltp),
  last_traded_quantity: toNumber(raw.last_traded_quantity),
  total_buy: toNumber(raw.total_buy),
  total_sell: toNumber(raw.total_sell),
  last_volume: toNumber(raw.last_volume),
  change: toNumber(raw.change),
  per_change: toNumber(raw.per_change),
  year_high: toNumber(raw.year_high),
  year_low: toNumber(raw.year_low),
  ohlc: {
    open: toNumber(raw.ohlc?.open),
    high: toNumber(raw.ohlc?.high),
    low: toNumber(raw.ohlc?.low),
    close: toNumber(raw.ohlc?.close),
  },
  depth: raw.depth || { buy: [], sell: [] },
});

const buildQueryToken = (instrument) =>
  `${instrument.exchangeSegment}|${instrument.exchangeIdentifier}`;

const getQuotes = async ({ instruments, filter = 'all' }) => {
  const session = authService.requireSession();
  const query = instruments.map(buildQueryToken).join(',');

  if (!query) {
    return [];
  }

  const response = await getJson({
    baseURL: session.baseUrl,
    url: `${QUOTES_BASE_PATH}/${encodeURIComponent(query)}/${filter}`,
    headers: {
      Authorization: env.KOTAK_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  if (!Array.isArray(response)) {
    if (response?.stat === 'Not_Ok') {
      throw new Error(response?.emsg || 'Kotak quotes API returned an error');
    }
    return [];
  }

  return response.map(normalizeQuote);
};

const getQuoteBySymbol = async (symbol, filter = 'all') => {
  const instrument = await instrumentService.findByAnySymbol(symbol);
  if (!instrument) {
    throw new Error(`Instrument not found for symbol: ${symbol}`);
  }

  const quotes = await getQuotes({
    instruments: [instrument],
    filter,
  });

  return {
    instrument,
    quote: quotes[0] || null,
  };
};

const getQuotesForUniverse = async ({ limit = 50, filter = 'all' } = {}) => {
  const instruments = await instrumentService.getTrackedUniverse(limit);
  return getQuotes({ instruments, filter });
};

export {
  normalizeQuote,
  getQuotes,
  getQuoteBySymbol,
  getQuotesForUniverse,
};

export default {
  normalizeQuote,
  getQuotes,
  getQuoteBySymbol,
  getQuotesForUniverse,
};
