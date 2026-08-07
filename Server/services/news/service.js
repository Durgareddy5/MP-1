import { fetchGoogleNews } from "./sources/googleNews.js";
import { fetchEconomicTimes } from "./sources/economicTimes.js";
import { fetchMoneycontrol } from "./sources/moneycontrol.js";

import { dedupe } from "./utils/dedupe.js";
import { normalize } from "./utils/normalize.js";
import { isCacheValid, getCache, setCache } from "./cache/cache.js";
import { CONFIG } from "./config.js";

export const getIndianNews = async (symbol) => {

  if (isCacheValid(symbol)) {
    return getCache(symbol);
  }

  const [google, et, mc] = await Promise.all([
    fetchGoogleNews(symbol),
    fetchEconomicTimes(),
    fetchMoneycontrol(),
  ]);

  const merged = [...google, ...et, ...mc];

  const unique = dedupe(merged);

  const normalized = normalize(unique);

  setCache(symbol, normalized);

  return normalized.slice(0, CONFIG.MAX_NEWS);
};