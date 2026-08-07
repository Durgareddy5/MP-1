import { useEffect, useRef } from 'react';
import { getSocket } from '@/services/socket';
import useMarketStore from '@/store/marketStore';

const useLiveMarketData = () => {
  const updateTick = useMarketStore((s) => s.updateTick);
  const updateDepth = useMarketStore((s) => s.updateDepth);
  const updateOrderBook = useMarketStore((s) => s.updateOrderBook);
  const setMarketStatus = useMarketStore((s) => s.setMarketStatus);

  const tickBuffer = useRef({});
  const lastFlush = useRef(0);

  useEffect(() => {
    const socket = getSocket();
    window.socketRef = socket;

    // Avoid noisy logging in normal operation.

    if (!socket?.on) return;

    const handleTick = (tick) => {
      if (!tick?.symbol) {
        return;
      }

      // Use symbol as key.
      const key = tick.symbol;

      tickBuffer.current[key] = {
        ...tick,
        key,
        displaySymbol: tick.symbol
          ?.replace('.NS', '')
          ?.replace('.BO', ''),
      };
    };

    const handleDepth = (depth) => {
      if (!depth?.key) return;
      updateDepth(depth);
    };


    const handleStatus = (status) => {
      if (!status) return;
      setMarketStatus(status);
    };

    const handleOrderBook = (payload) => {
      if (!payload?.symbol) return;
      updateOrderBook(payload);
    };


    const handleError = (error) => {
      console.error('Market stream error:', error?.message || error);
    };

    const tickListener = (e) => handleTick(e);
    const depthListener = (e) => handleDepth(e);
    const statusListener = (e) => handleStatus(e);
    const orderBookListener = (e) => handleOrderBook(e);
    const errorListener = (e) => handleError(e);

    socket.on('market:tick', tickListener);
    socket.on('market:depth', depthListener);
    socket.on('market:status', statusListener);
    socket.on('market:orderbook', orderBookListener);
    socket.on('market:error', errorListener);

    const interval = setInterval(() => {
      const bufferedTicks = Object.values(tickBuffer.current);

      if (!bufferedTicks.length) {
        return;
      }

      bufferedTicks.forEach((t) => updateTick(t));
      tickBuffer.current = {};
      lastFlush.current = Date.now();
    }, 100);

    return () => {
      socket.off('market:tick', tickListener);
      socket.off('market:depth', depthListener);
      socket.off('market:status', statusListener);
      socket.off('market:orderbook', orderBookListener);
      socket.off('market:error', errorListener);
      clearInterval(interval);
    };
  }, [setMarketStatus, updateDepth, updateOrderBook, updateTick]);

  return null;
};

export default useLiveMarketData;
