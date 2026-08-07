import { useEffect, useRef } from 'react';
import useMarketStore from '@/store/marketStore';
import { OHLCAggregator } from '@/utils/ohlcAggregator';

const useCandleStream = (marketKey) => {
  const tick = useMarketStore((s) => (marketKey ? s.ticksByKey[marketKey] : null));
  const setCandlesForKey = useMarketStore((s) => s.setCandlesForKey);

  const aggregatorRef = useRef(null);
  const candlesRef = useRef([]);

  useEffect(() => {
    if (!marketKey) return;

    aggregatorRef.current = new OHLCAggregator(60000);
    candlesRef.current = useMarketStore.getState().candlesByKey[marketKey] || [];
  }, [marketKey]);

  useEffect(() => {
    if (!marketKey || !tick || !aggregatorRef.current) return;

    const result = aggregatorRef.current.processTick({
      price: tick.price,
      timestamp: tick.timestamp,
    });

    if (result.type === 'new') {
      candlesRef.current = [...candlesRef.current, result.candle];
    }

    if (result.type === 'close') {
      const next = [...candlesRef.current];
      if (next.length > 0) {
        next[next.length - 1] = result.closed;
      }
      next.push(result.new);
      candlesRef.current = next;
    }

    if (result.type === 'update') {
      const next = [...candlesRef.current];
      if (next.length === 0) {
        next.push(result.candle);
      } else {
        next[next.length - 1] = result.candle;
      }
      candlesRef.current = next;
    }

    setCandlesForKey(marketKey, candlesRef.current);
  }, [marketKey, tick, setCandlesForKey]);
};

export default useCandleStream;
