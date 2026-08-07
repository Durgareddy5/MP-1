import { io } from 'socket.io-client';

let socketInstance = null;

// ==========================
// RESOLVE SOCKET URL
// ==========================
const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.VITE_API_URL) {
    try {
      return new URL(import.meta.env.VITE_API_URL, window.location.origin).origin;
    } catch (_) {
      return 'http://localhost:5001';
    }
  }

  if (typeof window !== 'undefined') {
    const { origin, port } = window.location;

    if (port === '3000' || port === '5173') {
      return 'http://localhost:5001';
    }

    return origin;
  }

  return 'http://localhost:5001';
};

// ==========================
// GET SOCKET INSTANCE
// ==========================
export const getSocket = () => {
  if (socketInstance) return socketInstance;

  socketInstance = io(resolveSocketUrl(), {
    transports: ['websocket'],
    reconnection: true,
    withCredentials: true,
    autoConnect: true,
  });

  socketInstance.on('connect', () => {
    console.log('✅ Socket connected:', socketInstance.id);
  });

  socketInstance.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error?.message || error);
  });

  return socketInstance;
};

// ==========================
// SUBSCRIBE / UNSUBSCRIBE
// ==========================
export const subscribeMarketData = (payload = {}) => {
  const socket = getSocket();
  socket.emit('market:subscribe', payload);
};

export const unsubscribeMarketData = (payload = {}) => {
  const socket = getSocket();
  socket.emit('market:unsubscribe', payload);
};

// ==========================
// LISTENERS
// ==========================

// 🔥 Live ticks
export const onMarketTick = (callback) => {
  const socket = getSocket();

  const handler = (tick) => {
    if (!tick) return;

    const cleanTick = {
      ...tick,
      displaySymbol: tick.symbol?.replace('.NS', '').replace('.BO', ''),
    };

    callback(cleanTick);
  };

  socket.on('market:tick', handler);

  return () => {
    socket.off('market:tick', handler);
  };
};

// 📊 Subscription confirmation
export const onSubscribed = (callback) => {
  const socket = getSocket();

  socket.off('market:subscribed');
  socket.on('market:subscribed', callback);

  return () => socket.off('market:subscribed', callback);
};

// 📡 Status updates
export const onMarketStatus = (callback) => {
  const socket = getSocket();

  socket.off('market:status');
  socket.on('market:status', callback);

  return () => socket.off('market:status', callback);
};

// ❌ Errors
export const onMarketError = (callback) => {
  const socket = getSocket();

  socket.off('market:error');
  socket.on('market:error', callback);

  return () => socket.off('market:error', callback);
};