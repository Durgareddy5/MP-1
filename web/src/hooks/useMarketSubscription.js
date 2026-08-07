import { useEffect, useMemo } from 'react';
import {
  subscribeMarketData,
  unsubscribeMarketData,
} from '@/services/socket';
import useMarketStore from '@/store/marketStore';

const uniq = (arr = []) => [...new Set(arr.filter(Boolean))];

const stableKey = (arr = []) => {
  try {
    return JSON.stringify(uniq(arr).slice().sort());
  } catch (_) {
    return '';
  }
};

const useMarketSubscription = ({
  symbols = [],
  indices = [],
  enabled = true,
} = {}) => {

  useMarketStore((s) => s.updateTick);

  const symbolsKey = useMemo(() => stableKey(symbols), [symbols]);
  const indicesKey = useMemo(() => stableKey(indices), [indices]);

  const payload = useMemo(() => ({
    symbols: uniq(symbols),
    indices: uniq(indices),
  }), [symbolsKey, indicesKey]);

  useEffect(() => {
    if (!enabled) return;

    if (!payload.symbols.length && !payload.indices.length) return;

    subscribeMarketData(payload);

    return () => {
      unsubscribeMarketData(payload);
    };
  }, [enabled, symbolsKey, indicesKey]);
};

export default useMarketSubscription;