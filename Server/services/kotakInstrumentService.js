import fs from 'fs/promises';
import path from 'path';
import env from '../config/environment.js';
import { getJson } from './kotakHttpClient.js';
import authService from './kotakAuthService.js';

const FILE_PATHS_ENDPOINT = '/script-details/1.0/masterscrip/file-paths';

const state = {
  loadedAt: null,
  instruments: [],
  byKey: new Map(),
  byExchangeIdentifier: new Map(),
};

const ensureCacheDir = async () => {
  const absoluteDir = path.resolve(process.cwd(), env.KOTAK_SCRIP_CACHE_DIR);
  await fs.mkdir(absoluteDir, { recursive: true });
  return absoluteDir;
};

const getCacheFilePath = async () => {
  const cacheDir = await ensureCacheDir();
  return path.join(cacheDir, 'instrument-master.json');
};

const splitCsvLine = (line) => {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
};

const parseCsv = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    rows.push(row);
  }

  return rows;
};

const normalizeInstrument = (row, sourceUrl = '') => {
  const exchangeSegment =
    row.pExchSeg ||
    row.exchangeSegment ||
    '';

  const exchangeIdentifier =
    row.exchangeIdentifier ||
    row.pSymbol ||
    '';

  const tradingSymbol =
    row.pTrdSymbol ||
    row.tradingSymbol ||
    row.displaySymbol ||
    '';

  const displaySymbol =
    row.displaySymbol ||
    tradingSymbol ||
    '';

  const instrumentName =
    row.pSymbolName ||
    row.instrumentName ||
    row.pSymbolNameNew ||
    displaySymbol ||
    tradingSymbol ||
    exchangeIdentifier;

  const symbol =
    displaySymbol.split('-')[0] ||
    tradingSymbol.split('-')[0] ||
    instrumentName;

  const lotSize = Number.parseInt(row.lLotSize || '1', 10) || 1;

  return {
    exchangeSegment,
    exchangeIdentifier: String(exchangeIdentifier),
    pSymbol: String(row.pSymbol || exchangeIdentifier || ''),
    tradingSymbol: String(tradingSymbol),
    displaySymbol: String(displaySymbol),
    instrumentName: String(instrumentName),
    symbol: String(symbol),
    lotSize,
    raw: row,
    sourceUrl,
  };
};

const normalizeLookup = (value = '') =>
  String(value)
    .replace(/-IN$/i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const isIndexQuery = (value = '') => /-IN$/i.test(String(value));

const isCashSegment = (segment = '') => {
  const s = String(segment).toLowerCase();
  return s.includes('cm');
};

const isIndexSegment = (segment = '') => {
  const s = String(segment).toLowerCase();
  return s.includes('index') || s.includes('idx') || s.includes('ind');
};


const hydrateIndexes = (instruments) => {
  state.instruments = instruments;
  state.byKey = new Map();
  state.byExchangeIdentifier = new Map();

  for (const instrument of instruments) {
    const key = `${instrument.exchangeSegment}|${instrument.exchangeIdentifier}`;
    state.byKey.set(key, instrument);

    const lookupKey = `${instrument.exchangeSegment}|${instrument.exchangeIdentifier}`;
    state.byExchangeIdentifier.set(lookupKey, instrument);
  }

  state.loadedAt = new Date().toISOString();
};

const saveCache = async (instruments) => {
  const filePath = await getCacheFilePath();
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        loadedAt: new Date().toISOString(),
        count: instruments.length,
        instruments,
      },
      null,
      2
    ),
    'utf8'
  );
};

const loadCachedScripMaster = async () => {
  try {
    const filePath = await getCacheFilePath();
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed.instruments) && parsed.instruments.length) {
      hydrateIndexes(parsed.instruments);
      return state.instruments;
    }

    return [];
  } catch (_) {
    return [];
  }
};

const fetchFilePaths = async () => {
  const session = authService.requireSession();

  const response = await getJson({
    baseURL: session.baseUrl,
    url: FILE_PATHS_ENDPOINT,
    headers: {
      Authorization: env.KOTAK_ACCESS_TOKEN,
    },
  });

  return response?.data?.filesPaths || [];
};

const filterRelevantCsvs = (urls) =>
  urls.filter((url) => {
    const lower = url.toLowerCase();

    return (
      lower.includes('nse_cm') ||
      lower.includes('bse_cm') ||
      lower.includes('nse_fo') ||
      lower.includes('bse_fo') ||
      lower.includes('index') ||
      lower.includes('indices') ||
      lower.includes('nse_if') ||
      lower.includes('bse_if')
    );
  });



const fetchCsvText = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/csv,text/plain,*/*',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download scrip master CSV: ${url} (status ${response.status})`
    );
  }

  return response.text();
};




const refreshScripMaster = async () => {
  const urls = await fetchFilePaths();
  const relevantUrls = filterRelevantCsvs(urls);

  if (!relevantUrls.length) {
    throw new Error('No NSE/BSE scrip master CSV URLs found');
  }

  const settled = await Promise.allSettled(
    relevantUrls.map(async (url) => ({
      url,
      csvText: await fetchCsvText(url),
    }))
  );

  const successful = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  const failed = settled
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message || 'Unknown CSV download error');

  if (failed.length > 0) {
    console.warn('⚠️ Some scrip master files failed to download:');
    failed.forEach((msg) => console.warn(`   - ${msg}`));
  }

  if (successful.length === 0) {
    throw new Error('All NSE/BSE scrip master CSV downloads failed');
  }

  const instruments = successful
    .flatMap(({ csvText, url }) => {
      const rows = parseCsv(csvText);
      return rows.map((row) => normalizeInstrument(row, url));
    })
    .filter((item) => item.exchangeSegment && item.exchangeIdentifier);

  hydrateIndexes(instruments);
  await saveCache(instruments);

  return instruments;
};



const ensureScripMasterLoaded = async () => {
  if (state.instruments.length > 0) return state.instruments;

  const cached = await loadCachedScripMaster();
  if (cached.length > 0) return cached;

  return refreshScripMaster();
};



const searchInstruments = async ({ query, exchangeSegment, limit = 20 }) => {
  await ensureScripMasterLoaded();

  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  return state.instruments
    .filter((instrument) => {
      if (exchangeSegment && instrument.exchangeSegment !== exchangeSegment) {
        return false;
      }

      return [
        instrument.symbol,
        instrument.displaySymbol,
        instrument.tradingSymbol,
        instrument.instrumentName,
        instrument.exchangeIdentifier,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q));
    })
    .slice(0, limit);
};

const findByExchangeIdentifier = async ({ exchangeSegment, exchangeIdentifier }) => {
  await ensureScripMasterLoaded();
  return (
    state.byExchangeIdentifier.get(`${exchangeSegment}|${String(exchangeIdentifier)}`) ||
    null
  );
};

const getAllIndexInstruments = async (limit = 200) => {
  await ensureScripMasterLoaded();

  return state.instruments
    .filter((instrument) => {
      const raw = instrument.raw || {};

      const exchangeOk = ['nse_cm', 'bse_cm'].includes(instrument.exchangeSegment);
      const hasName = Boolean(
        instrument.displaySymbol ||
        instrument.tradingSymbol ||
        instrument.instrumentName
      );

      // Real indices usually do not carry ISIN / equity-style exchange metadata
      const looksLikeIndex =
        !raw.pISIN &&
        !raw.pExchange &&
        !raw.pGroup &&
        instrument.lotSize === 1;

      // Avoid ETF/INAV-like symbols
      const nameBlob = [
        instrument.symbol,
        instrument.displaySymbol,
        instrument.tradingSymbol,
        instrument.instrumentName,
      ]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();

      const excludeNonIndex =
        !nameBlob.includes('INAV') &&
        !nameBlob.includes('ETF') &&
        !nameBlob.includes('FUND');

      return exchangeOk && hasName && looksLikeIndex && excludeNonIndex;
    })
    .slice(0, limit);
};


const findByAnySymbol = async (symbol) => {
  await ensureScripMasterLoaded();

  const normalized = String(symbol || '').trim().toLowerCase();
  if (!normalized) return null;

  return (
    state.instruments.find((instrument) => {
      return [
        instrument.symbol,
        instrument.displaySymbol,
        instrument.tradingSymbol,
        instrument.instrumentName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase() === normalized);
    }) || null
  );
};

const getTrackedUniverse = async (limit = 50) => {
  await ensureScripMasterLoaded();

  return state.instruments
    .filter((instrument) =>
      ['nse_cm', 'bse_cm'].includes(instrument.exchangeSegment) &&
      instrument.tradingSymbol &&
      instrument.displaySymbol
    )
    .slice(0, limit);
};

const getInstrumentCount = async () => {
  await ensureScripMasterLoaded();
  return state.instruments.length;
};

export {
  loadCachedScripMaster,
  refreshScripMaster,
  ensureScripMasterLoaded,
  searchInstruments,
  findByExchangeIdentifier,
  findByAnySymbol,
  getTrackedUniverse,
  getInstrumentCount,
  getAllIndexInstruments,
};

export default {
  loadCachedScripMaster,
  refreshScripMaster,
  ensureScripMasterLoaded,
  searchInstruments,
  findByExchangeIdentifier,
  findByAnySymbol,
  getTrackedUniverse,
  getInstrumentCount,
  getAllIndexInstruments,
};

