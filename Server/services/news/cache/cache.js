import { CONFIG } from "../config.js";

const cache = {};

export const isCacheValid = (symbol) => {
  return cache[symbol] &&
    (Date.now() - cache[symbol].time < CONFIG.CACHE_TTL);
};

export const getCache = (symbol) => {
  return cache[symbol]?.data || [];
};

export const setCache = (symbol, data) => {
  cache[symbol] = {
    data,
    time: Date.now(),
  };
};