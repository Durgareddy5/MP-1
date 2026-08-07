import YahooFinance from 'yahoo-finance2';
import { getMarketStatus } from '../utils/helpers.js';

const yahooFinance = new YahooFinance();

const DEFAULT_INDEXES = [
  { exchangeSegment: 'nse_cm', query: 'Nifty 50', symbol: 'NIFTY 50' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Bank', symbol: 'NIFTY BANK' },
  { exchangeSegment: 'bse_cm', query: 'SENSEX', symbol: 'SENSEX' },
  { exchangeSegment: 'bse_cm', query: 'BANKEX', symbol: 'BANKEX' },
  { exchangeSegment: 'bse_cm', query: 'SENSEX50', symbol: 'SENSEX50' },

  { exchangeSegment: 'nse_cm', query: 'Nifty 100', symbol: 'NIFTY 100' },
  { exchangeSegment: 'nse_cm', query: 'Nifty 500', symbol: 'NIFTY 500' },

  { exchangeSegment: 'nse_cm', query: 'Nifty IT', symbol: 'NIFTY IT' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Pharma', symbol: 'NIFTY PHARMA' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Auto', symbol: 'NIFTY AUTO' },
  { exchangeSegment: 'nse_cm', query: 'Nifty FMCG', symbol: 'NIFTY FMCG' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Metal', symbol: 'NIFTY METAL' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Realty', symbol: 'NIFTY REALTY' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Energy', symbol: 'NIFTY ENERGY' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Infra', symbol: 'NIFTY INFRA' },
  { exchangeSegment: 'nse_cm', query: 'India VIX', symbol: 'INDIA VIX' },
  { exchangeSegment: 'nse_cm', query: 'Nifty PSU Bank', symbol: 'NIFTY PSU BANK' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Midcap 50', symbol: 'NIFTY MIDCAP 50' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Next 50', symbol: 'NIFTY NEXT 50' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Smallcap 100', symbol: 'NIFTY SMALLCAP 100' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Financial Services', symbol: 'NIFTY FIN SERVICE' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Healthcare', symbol: 'NIFTY HEALTHCARE' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Consumer Durables', symbol: 'NIFTY CONSUMER DURABLES' },
  { exchangeSegment: 'nse_cm', query: 'Nifty Oil & Gas', symbol: 'NIFTY OIL & GAS' },
];

const getStatus = () => getMarketStatus();

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeYahooSymbol = (symbol = '') => {
  const s = String(symbol).trim().toUpperCase();

  if (!s) return '';
  if (s === 'NIFTY 50') return '^NSEI';
  if (s === 'NIFTY BANK') return '^NSEBANK';
  if (s === 'SENSEX') return '^BSESN';
  if (s === 'INDIA VIX') return '^INDIAVIX';

  // Common NSE index symbols on Yahoo
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

  if (s.startsWith('^') || s.includes('.NS') || s.includes('.BO')) return s;

  return `${s}.NS`;
};

const toIsoTime = (quote) => {
  const ts = Number(quote?.regularMarketTime || quote?.postMarketTime || 0);
  if (!ts || ts <= 0) return new Date().toISOString();

  const ms = ts > 10_000_000_000 ? ts : ts * 1000;
  return new Date(ms).toISOString();
};

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const mapYahooQuoteToKotakLike = (q) => {
  if (!q) return null;

  return {
    exchange: q.fullExchangeName || q.exchange || '',
    exchange_token: q.symbol || '',
    display_symbol: (q.shortName || q.longName || q.symbol || '').toString(),
    last_updated: toIsoTime(q),
    ltp: toNumber(q.regularMarketPrice),
    last_traded_quantity: 0,
    total_buy: 0,
    total_sell: 0,
    last_volume: toNumber(q.regularMarketVolume),
    change: toNumber(q.regularMarketChange),
    per_change: toNumber(q.regularMarketChangePercent),
    year_high: toNumber(q.fiftyTwoWeekHigh),
    year_low: toNumber(q.fiftyTwoWeekLow),
    ohlc: {
      open: toNumber(q.regularMarketOpen),
      high: toNumber(q.regularMarketDayHigh),
      low: toNumber(q.regularMarketDayLow),
      close: toNumber(q.regularMarketPreviousClose),
    },
    depth: null,
  };
};

const getAllIndices = async () => {
  const symbols = DEFAULT_INDEXES.map((item) => normalizeYahooSymbol(item.symbol));
  const rawQuotes = ensureArray(await yahooFinance.quote(symbols));
  const quotes = rawQuotes.map(mapYahooQuoteToKotakLike).filter(Boolean);

  return quotes.map((quote) => ({
    symbol: quote.display_symbol || quote.exchange_token,
    name: quote.display_symbol || quote.exchange_token,
    exchange: quote.exchange,
    current_value: Number(quote.ltp || 0),
    change: Number(quote.change || 0),
    change_percent: Number(quote.per_change || 0),
    open: Number(quote?.ohlc?.open || 0),
    high: Number(quote?.ohlc?.high || 0),
    low: Number(quote?.ohlc?.low || 0),
    previous_close: Number(quote?.ohlc?.close || 0),
    volume: Number(quote.last_volume || 0),
    market_status: getMarketStatus().status,
    last_updated: quote.last_updated,
  }));
};

const searchStocks = async (query, limit = 15) => {
  const response = await yahooFinance.search(query);
  const quotes = (response?.quotes || []).slice(0, limit);

  return quotes.map((item) => ({
    symbol: item.symbol || '',
    name: item.shortname || item.longname || item.symbol || '',
    exchange: item.exchange || item.exchDisp || '',
    display_symbol: item.symbol || '',
    trading_symbol: item.symbol || '',
    exchange_identifier: item.symbol || '',
    lot_size: 1,
  }));
};

const getStockQuote = async (symbol) => {
  const ySymbol = normalizeYahooSymbol(symbol);
  if (!ySymbol) {
    throw new Error('Symbol is required');
  }

  let raw;
  try {
    raw = await yahooFinance.quote(ySymbol);
  } catch (err) {
    // Fall through to search-based fallback below.
    raw = null;
  }

  let quote = mapYahooQuoteToKotakLike(raw);

  // If direct quote failed (common for symbol formatting issues), try resolving via search.
  if (!quote) {
    try {
      const rawInput = String(symbol || '').trim();
      const baseQuery = rawInput.replace(/\.NS$/i, '').replace(/\.BO$/i, '');

      const searchRes = await yahooFinance.search(baseQuery);
      const candidates = (searchRes?.quotes || [])
        .map((q) => q?.symbol)
        .filter(Boolean);

      // Prefer NSE equity symbols if present.
      const fallbackSymbol =
        candidates.find((s) => String(s).toUpperCase().endsWith('.NS')) ||
        candidates[0];

      if (fallbackSymbol) {
        raw = await yahooFinance.quote(fallbackSymbol);
        quote = mapYahooQuoteToKotakLike(raw);
      }
    } catch (_) {
      // ignore fallback failures, handled by final error below
    }
  }

  // Last-chance fallback: try alternate exchange suffixes for Indian equities.
  if (!quote) {
    const rawInput = String(symbol || '').trim().toUpperCase();
    const base = rawInput.replace(/\.NS$/i, '').replace(/\.BO$/i, '');

    for (const suffix of ['.NS', '.BO']) {
      try {
        raw = await yahooFinance.quote(`${base}${suffix}`);
        quote = mapYahooQuoteToKotakLike(raw);
        if (quote) break;
      } catch (_) {
        // try next suffix
      }
    }
  }

  if (!quote) {
    // Make error explicit so controller can return a 404 only for true not-found.
    const e = new Error(`No quote found for symbol: ${symbol}`);
    e.code = 'SYMBOL_NOT_FOUND';
    throw e;
  }

  const displaySymbol = (raw?.symbol || ySymbol || '').replace(/\.NS$/i, '').replace(/\.BO$/i, '');

  return {
    symbol: displaySymbol,
    name: raw?.shortName || raw?.longName || displaySymbol,
    exchange: raw?.fullExchangeName || raw?.exchange || '',
    exchange_identifier: raw?.symbol || ySymbol,
    display_symbol: displaySymbol,
    trading_symbol: raw?.symbol || ySymbol,
    quote: {
      price: Number(quote.ltp || 0),
      previous_close: Number(quote?.ohlc?.close || 0),
      open: Number(quote?.ohlc?.open || 0),
      high: Number(quote?.ohlc?.high || 0),
      low: Number(quote?.ohlc?.low || 0),
      change: Number(quote.change || 0),
      change_percent: Number(quote.per_change || 0),
      volume: Number(quote.last_volume || 0),
      last_traded_quantity: 0,
      total_buy: 0,
      total_sell: 0,
      week_52_high: Number(quote.year_high || 0),
      week_52_low: Number(quote.year_low || 0),
      last_updated: quote.last_updated,
    },
    market_depth: null,
    company_info: {
      lot_size: 1,
      market_cap: toNumber(raw?.marketCap),
      pe_ratio: toNumber(raw?.trailingPE),
      pb_ratio: toNumber(raw?.priceToBook),
      eps: toNumber(raw?.epsTrailingTwelveMonths),
      dividend_yield: toNumber(raw?.trailingAnnualDividendYield),
    },
  };
};

const getHistorical = async ({ symbol, period1, period2, interval = '1d' }) => {
  const ySymbol = normalizeYahooSymbol(symbol);
  if (!ySymbol) {
    throw new Error('Symbol is required');
  }

  let rows = [];
  try {
    rows = await yahooFinance.historical(ySymbol, {
      period1,
      period2,
      interval,
    });
  } catch (_) {
    // Some providers reject intraday combinations for `historical`.
    // Fall back to chart API below instead of failing the whole request.
    rows = [];
  }

  const mapped = (rows || []).map((row) => ({
    time: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
    open: toNumber(row.open),
    high: toNumber(row.high),
    low: toNumber(row.low),
    close: toNumber(row.close),
    volume: toNumber(row.volume),
  }));

  if (mapped.length) return mapped;

  try {
    const chart = await yahooFinance.chart(ySymbol, {
      period1,
      period2,
      interval,
    });

    const ts = chart?.timestamp || [];
    const quote = chart?.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    const out = [];
    for (let i = 0; i < ts.length; i += 1) {
      const t = Number(ts[i] || 0);
      if (!t) continue;
      const open = opens[i];
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];

      if (
        open === null || open === undefined ||
        high === null || high === undefined ||
        low === null || low === undefined ||
        close === null || close === undefined
      ) {
        continue;
      }

      out.push({
        time: new Date(t * 1000).toISOString(),
        open: toNumber(open),
        high: toNumber(high),
        low: toNumber(low),
        close: toNumber(close),
        volume: toNumber(volumes[i]),
      });
    }

    return out;
  } catch (_) {
    return [];
  }
};

const sortByField = (quotes, field, direction = 'desc', limit = 10) => {
  const sorted = [...quotes].sort((a, b) => {
    const av = Number(a[field] || 0);
    const bv = Number(b[field] || 0);
    return direction === 'desc' ? bv - av : av - bv;
  });

  return sorted.slice(0, limit);
};

const toMoverShape = (quote) => ({
  symbol: quote.display_symbol || quote.exchange_token,
  name: quote.display_symbol || quote.exchange_token,
  exchange: quote.exchange,
  price: Number(quote.ltp || 0),
  change: Number(quote.change || 0),
  change_percent: Number(quote.per_change || 0),
  volume: Number(quote.last_volume || 0),
});

const tryScreener = async (scrIds) => {
  try {
    const response = await yahooFinance.screener({ scrIds });
    const results = response?.finance?.result?.[0]?.quotes || [];
    return results;
  } catch (_) {
    return [];
  }
};

const getTopGainers = async (limit = 10) => {
  const results = await tryScreener('day_gainers');
  const quotes = results.map(mapYahooQuoteToKotakLike).filter(Boolean);
  return sortByField(quotes, 'per_change', 'desc', limit).map(toMoverShape);
};

const getTopLosers = async (limit = 10) => {
  const results = await tryScreener('day_losers');
  const quotes = results.map(mapYahooQuoteToKotakLike).filter(Boolean);
  return sortByField(quotes, 'per_change', 'asc', limit).map(toMoverShape);
};

const getMostActive = async (limit = 10) => {
  const results = await tryScreener('most_actives');
  const quotes = results.map(mapYahooQuoteToKotakLike).filter(Boolean);
  return sortByField(quotes, 'last_volume', 'desc', limit).map(toMoverShape);
};

const refreshInstrumentMaster = async () => ({
  count: 0,
  loaded_at: new Date().toISOString(),
  status: 'not_supported',
});

const getInstrumentMasterStats = async () => ({
  count: 0,
  status: 'not_supported',
});

export {
  getStatus,
  getAllIndices,
  searchStocks,
  getStockQuote,
  getHistorical,
  getTopGainers,
  getTopLosers,
  getMostActive,
  refreshInstrumentMaster,
  getInstrumentMasterStats,
};

export default {
  getStatus,
  getAllIndices,
  searchStocks,
  getStockQuote,
  getHistorical,
  getTopGainers,
  getTopLosers,
  getMostActive,
  refreshInstrumentMaster,
  getInstrumentMasterStats,
};
