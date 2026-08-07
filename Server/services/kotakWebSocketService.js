import { EventEmitter } from 'events';
import NodeWebSocket from 'ws';

import authService from './kotakAuthService.js';

const HSM_URL = 'wss://mlhsm.kotaksecurities.com';
const CHANNEL_NUMBER = 1;
const RECONNECT_DELAY_MS = 5000;

const emitter = new EventEmitter();

const state = {
  socket: null,
  connected: false,
  connecting: false,
  subscriptions: {
    scrips: new Set(),
    indices: new Set(),
    depth: new Set(),
  },
  reconnectTimer: null,
};

const uniq = (items = []) => [...new Set(items.filter(Boolean))];

const getTickTimestamp = (raw) => {
  const candidate =
    raw.ft ||
    raw.fdtm ||
    raw.ltt ||
    raw.ltqTime ||
    raw.dt ||
    raw.t;

  const numeric = Number(candidate || 0);

  if (numeric > 0) {
    if (numeric > 9999999999) return numeric;
    return numeric * 1000;
  }

  return Date.now();
};

const getDisplaySymbol = (raw) => raw.ts || raw.name || raw.tk || '';

const normalizeScripTick = (raw) => ({
  feedType: 'scrip',
  key: `${raw.e || ''}|${raw.tk || ''}`,
  exchangeSegment: raw.e || '',
  exchange: raw.e || '',
  symbol: raw.ts || raw.tk || '',
  displaySymbol: getDisplaySymbol(raw),
  exchangeIdentifier: raw.tk || '',
  tradingSymbol: raw.ts || '',
  name: raw.name || raw.ts || raw.tk || '',
  price: Number(raw.ltp || 0),
  change: Number(raw.cng || 0),
  changePercent: Number(raw.nc || 0),
  open: Number(raw.op || 0),
  high: Number(raw.h || 0),
  low: Number(raw.lo || 0),
  close: Number(raw.c || 0),
  volume: Number(raw.v || 0),
  lastTradedQuantity: Number(raw.ltq || 0),
  totalBuyQty: Number(raw.tbq || 0),
  totalSellQty: Number(raw.tsq || 0),
  bestBidPrice: Number(raw.bp || 0),
  bestAskPrice: Number(raw.sp || 0),
  bestBidQty: Number(raw.bq || 0),
  bestAskQty: Number(raw.bs || 0),
  turnover: Number(raw.to || 0),
  oi: Number(raw.oi || 0),
  timestamp: getTickTimestamp(raw),
  raw,
});

const normalizeIndexTick = (raw) => ({
  feedType: 'index',
  key: `${raw.e || ''}|${raw.tk || ''}`,
  exchangeSegment: raw.e || '',
  exchange: raw.e || '',
  symbol: raw.ts || raw.tk || '',
  displaySymbol: getDisplaySymbol(raw),
  exchangeIdentifier: raw.tk || '',
  tradingSymbol: raw.ts || '',
  name: raw.name || raw.ts || raw.tk || '',
  price: Number(raw.iv || 0),
  change: Number(raw.cng || 0),
  changePercent: Number(raw.nc || 0),
  open: Number(raw.openingPrice || 0),
  high: Number(raw.highPrice || 0),
  low: Number(raw.lowPrice || 0),
  close: Number(raw.ic || 0),
  volume: 0,
  timestamp: getTickTimestamp(raw),
  raw,
});

const normalizeDepth = (raw) => ({
  key: `${raw.e || ''}|${raw.tk || ''}`,
  exchangeSegment: raw.e || '',
  exchange: raw.e || '',
  symbol: raw.ts || raw.tk || '',
  displaySymbol: getDisplaySymbol(raw),
  exchangeIdentifier: raw.tk || '',
  tradingSymbol: raw.ts || '',
  name: raw.name || raw.ts || raw.tk || '',
  buy: [
    { price: Number(raw.bp || 0), quantity: Number(raw.bq || 0), orders: Number(raw.bno1 || 0) },
    { price: Number(raw.bp1 || 0), quantity: Number(raw.bq1 || 0), orders: Number(raw.bno2 || 0) },
    { price: Number(raw.bp2 || 0), quantity: Number(raw.bq2 || 0), orders: Number(raw.bno3 || 0) },
    { price: Number(raw.bp3 || 0), quantity: Number(raw.bq3 || 0), orders: Number(raw.bno4 || 0) },
    { price: Number(raw.bp4 || 0), quantity: Number(raw.bq4 || 0), orders: Number(raw.bno5 || 0) },
  ],
  sell: [
    { price: Number(raw.sp || 0), quantity: Number(raw.bs || 0), orders: Number(raw.sno1 || 0) },
    { price: Number(raw.sp1 || 0), quantity: Number(raw.bs1 || 0), orders: Number(raw.sno2 || 0) },
    { price: Number(raw.sp2 || 0), quantity: Number(raw.bs2 || 0), orders: Number(raw.sno3 || 0) },
    { price: Number(raw.sp3 || 0), quantity: Number(raw.bs3 || 0), orders: Number(raw.sno4 || 0) },
    { price: Number(raw.sp4 || 0), quantity: Number(raw.bs4 || 0), orders: Number(raw.sno5 || 0) },
  ],
  timestamp: getTickTimestamp(raw),
  raw,
});

const emitStatus = (status) => {
  emitter.emit('status', {
    ...status,
    timestamp: new Date().toISOString(),
  });
};

const emitError = (error) => {
  emitter.emit('error', {
    ...error,
    timestamp: new Date().toISOString(),
  });
};

const parseDecodedMessage = (payload) => {
  const asString =
    typeof payload === 'string'
      ? payload
      : Buffer.isBuffer(payload)
        ? payload.toString('utf8')
        : String(payload ?? '');

  try {
    const parsed = JSON.parse(asString);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const classifyAndEmit = (message) => {
  if (!message || typeof message !== 'object') return;

  if (message.stat === 'NotOk' || message.stat === 'Not_Ok') {
    emitError({
      type: 'provider_error',
      message: message.msg || message.emsg || 'Kotak websocket error',
      raw: message,
    });
    return;
  }

  if (message.type === 'cn') {
    emitStatus({
      connected: true,
      provider: 'kotak',
      status: 'connected',
      message: 'Kotak market feed connected',
    });
    return;
  }

  if (message.bp !== undefined || message.sp !== undefined) {
    emitter.emit('depth', normalizeDepth(message));
    return;
  }

  if (message.iv !== undefined || message.openingPrice !== undefined) {
    emitter.emit('tick', normalizeIndexTick(message));
    return;
  }

  if (message.ltp !== undefined || message.v !== undefined || message.ltq !== undefined) {
    emitter.emit('tick', normalizeScripTick(message));
  }
};

const send = (payload) => {
  if (!state.socket || state.socket.readyState !== NodeWebSocket.OPEN) return;
  state.socket.send(JSON.stringify(payload));
};

const replaySubscriptions = () => {
  if (state.subscriptions.scrips.size > 0) {
    send({
      type: 'mws',
      scrips: [...state.subscriptions.scrips].join('&'),
      channelnum: CHANNEL_NUMBER,
    });
  }

  if (state.subscriptions.indices.size > 0) {
    send({
      type: 'ifs',
      scrips: [...state.subscriptions.indices].join('&'),
      channelnum: CHANNEL_NUMBER,
    });
  }

  if (state.subscriptions.depth.size > 0) {
    send({
      type: 'dps',
      scrips: [...state.subscriptions.depth].join('&'),
      channelnum: CHANNEL_NUMBER,
    });
  }
};

const ensureSession = async () => {
  if (authService.isSessionReady()) {
    return authService.requireSession();
  }

  return authService.createSession({});
};

const scheduleReconnect = () => {
  if (state.reconnectTimer) return;

  state.reconnectTimer = setTimeout(async () => {
    state.reconnectTimer = null;
    try {
      await connect();
    } catch (error) {
      emitError({
        type: 'reconnect_failed',
        message: error.message,
      });
    }
  }, RECONNECT_DELAY_MS);
};

const connect = async () => {
  if (state.connected || state.connecting) return;

  const session = await ensureSession();
  state.connecting = true;

  await new Promise((resolve, reject) => {
    const socket = new NodeWebSocket(`${HSM_URL}?token=${session.tradeToken}&sid=${session.tradeSid}`);
    let settled = false;

    const finishResolve = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const finishReject = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    socket.on('open', () => {

        console.log('[kotakWS] websocket opened');
        console.log('[kotakWS] session tokens present:', {
        hasTradeToken: Boolean(session.tradeToken),
        hasAuthToken: Boolean(session.authToken),
        hasTradeSid: Boolean(session.tradeSid),
        hasSid: Boolean(session.sid),
      });

      state.socket = socket;
      state.connected = true;
      state.connecting = false;

      send({
       type: 'cn',
       Authorization: session.tradeToken,
       Sid: session.tradeSid,
       channelnum: CHANNEL_NUMBER,   // 🔥 THIS WAS MISSING
     });

      replaySubscriptions();
      finishResolve();
    });

    // socket.on('message', (payload) => {
    //   console.log('🔥 RAW:', payload.toString());
    //   console.log('RAW KOTAK MESSAGE:', payload);
    //   const messages = parseDecodedMessage(payload);
    //   console.log('PARSED KOTAK MESSAGE:', messages);
    //   messages.forEach(classifyAndEmit);
    // });

    socket.on('message', (payload) => {
  const raw = payload.toString();
  console.log('🔥 RAW KOTAK:', raw);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.log('❌ NOT JSON:', raw);
    return;
  }

  console.log('✅ PARSED:', parsed);

  const messages = Array.isArray(parsed) ? parsed : [parsed];
  messages.forEach(classifyAndEmit);
});


    socket.on('close', () => {
     socket.on('close', (code, reason) => {
  console.log('❌ CLOSED:', code, reason?.toString());
});
     console.log('[kotakWS] websocket closed');

      state.connected = false;
      state.connecting = false;
      state.socket = null;

      emitStatus({
        connected: false,
        provider: 'kotak',
        status: 'disconnected',
        message: 'Kotak market feed disconnected',
      });

      scheduleReconnect();
    });

    socket.on('error', (error) => {
      console.log('[kotakWS] websocket error:', error?.message || error);
      state.connected = false;
      state.connecting = false;

      emitError({
        type: 'socket_error',
        message: error?.message || 'Kotak websocket error',
      });

      finishReject(error);
    });
  });
};

const disconnect = () => {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }

  if (state.socket) {
    state.socket.close();
  }

  state.socket = null;
  state.connected = false;
  state.connecting = false;
};

const subscribeScrips = async (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.scrips.add(key));
  await connect();

  send({
    type: 'mws',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const unsubscribeScrips = (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.scrips.delete(key));

  send({
    type: 'mwu',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const subscribeIndices = async (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.indices.add(key));
  console.log('[kotakWS] subscribeIndices keys:', uniq(keys));
  await connect();

  send({
    type: 'ifs',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const unsubscribeIndices = (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.indices.delete(key));

  send({
    type: 'ifu',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const subscribeDepth = async (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.depth.add(key));
  await connect();

  send({
    type: 'dps',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const unsubscribeDepth = (keys = []) => {
  uniq(keys).forEach((key) => state.subscriptions.depth.delete(key));

  send({
    type: 'dpu',
    scrips: uniq(keys).join('&'),
    channelnum: CHANNEL_NUMBER,
  });
};

const pauseChannel = () => {
  send({
    type: 'cp',
    channelnums: [CHANNEL_NUMBER],
  });
};

const resumeChannel = () => {
  send({
    type: 'cr',
    channelnums: [CHANNEL_NUMBER],
  });
};

const onTick = (handler) => emitter.on('tick', handler);
const onDepth = (handler) => emitter.on('depth', handler);
const onStatus = (handler) => emitter.on('status', handler);
const onError = (handler) => emitter.on('error', handler);

const offTick = (handler) => emitter.off('tick', handler);
const offDepth = (handler) => emitter.off('depth', handler);
const offStatus = (handler) => emitter.off('status', handler);
const offError = (handler) => emitter.off('error', handler);

export {
  connect,
  disconnect,
  subscribeScrips,
  unsubscribeScrips,
  subscribeIndices,
  unsubscribeIndices,
  subscribeDepth,
  unsubscribeDepth,
  pauseChannel,
  resumeChannel,
  onTick,
  onDepth,
  onStatus,
  onError,
  offTick,
  offDepth,
  offStatus,
  offError,
};

export default {
  connect,
  disconnect,
  subscribeScrips,
  unsubscribeScrips,
  subscribeIndices,
  unsubscribeIndices,
  subscribeDepth,
  unsubscribeDepth,
  pauseChannel,
  resumeChannel,
  onTick,
  onDepth,
  onStatus,
  onError,
  offTick,
  offDepth,
  offStatus,
  offError,
};
