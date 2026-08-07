import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, CrosshairMode } from 'lightweight-charts';
import {
  ArrowLeft, Star, StarOff, TrendingUp, TrendingDown,
  Activity, BarChart3, Info, BookOpen, Newspaper,
  Plus, Minus, ChevronDown, Loader2, AlertCircle,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatINR, formatPercent, formatVolume, getPnLColor } from '@/utils/formatters';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import tradingService from '@/services/tradingService';
import usePortfolioStore from '@/store/usePortfolioStore';
import useMarketStore from '@/store/marketStore';
import useMarketSubscription from '@/hooks/useMarketSubscription';
import OrderBook from '@/components/OrderBook';
import MiniOrderBookSidebar from '@/components/MiniOrderBookSidebar';
import NewsTab from "./NewsTab";

/* ─── Mock stock data map ─────────────────────── */
const STOCK_MAP = {
  RELIANCE:  { name:'Reliance Industries Ltd', sector:'Energy',       exchange:'NSE', price:1285.50, prevClose:1273.15, open:1275.00, high:1298.40, low:1268.90, volume:4520000, marketCap:1735000000000, pe:27.4,  pb:2.8,  eps:46.92, div:0.44, week52H:1608.95, week52L:1115.50, lot:1 },
  TCS:       { name:'Tata Consultancy Services',sector:'IT',          exchange:'NSE', price:3542.80, prevClose:3570.95, open:3565.00, high:3590.20, low:3528.40, volume:980000,  marketCap:1283000000000, pe:31.2,  pb:13.4, eps:113.55,div:1.18, week52H:4255.00, week52L:3141.85, lot:1 },
  HDFCBANK:  { name:'HDFC Bank Ltd',            sector:'Banking',     exchange:'NSE', price:1672.30, prevClose:1656.70, open:1660.00, high:1685.90, low:1655.40, volume:3890000, marketCap:1261000000000, pe:19.8,  pb:2.6,  eps:84.46, div:1.50, week52H:1881.00, week52L:1363.55, lot:1 },
  INFY:      { name:'Infosys Ltd',              sector:'IT',          exchange:'NSE', price:1495.25, prevClose:1486.85, open:1490.00, high:1502.60, low:1484.30, volume:2640000, marketCap:623000000000,  pe:27.1,  pb:8.9,  eps:55.18, div:2.20, week52H:1906.00, week52L:1307.35, lot:1 },
  SBIN:      { name:'State Bank of India',      sector:'Banking',     exchange:'NSE', price:812.40,  prevClose:805.55,  open:808.00,  high:820.50,  low:805.00,  volume:12000000,marketCap:724000000000,  pe:10.2,  pb:1.6,  eps:79.65, div:1.30, week52H:912.00,  week52L:543.35,  lot:1 },
  WIPRO:     { name:'Wipro Ltd',                sector:'IT',          exchange:'NSE', price:472.65,  prevClose:475.75,  open:474.00,  high:476.80,  low:470.10,  volume:3820000, marketCap:245000000000,  pe:21.4,  pb:3.2,  eps:22.09, div:1.00, week52H:593.00,  week52L:415.00,  lot:1 },
};

const FALLBACK = STOCK_MAP.RELIANCE;

const KNOWN_INDEX_KEYS = new Set([
  'NIFTY50',
  'NIFTYBANK',
  'SENSEX',
  'INDIAVIX',
  'NIFTY100',
  'NIFTY500',
  'NIFTYIT',
  'NIFTYPHARMA',
  'NIFTYAUTO',
  'NIFTYFMCG',
  'NIFTYMETAL',
  'NIFTYREALTY',
  'NIFTYENERGY',
  'NIFTYINFRA',
  'NIFTYPSUBANK',
  'NIFTYMIDCAP50',
  'NIFTYNEXT50',
  'NIFTYSMALLCAP100',
  'NIFTYFINSERVICE',
  'NIFTYHEALTHCARE',
  'NIFTYCONSUMERDURABLES',
  'NIFTYOIL&GAS',
]);

const isIndexSymbol = (value = '') => {
  const raw = String(value || '');
  if (!raw) return false;
  if (raw.toUpperCase().endsWith('-IN')) return true;
  const key = normalizeSymbol(raw);
  return KNOWN_INDEX_KEYS.has(key);
};

const toIndexDisplaySymbol = (value = '') =>
  String(value)
    .replace(/-IN$/i, '')
    .replace(/_/g, ' ')
    .trim()
    .toUpperCase();

const toYahooIndexSymbol = (value = '') => {
  const s = toIndexDisplaySymbol(value);
  if (s === 'NIFTY 50') return '^NSEI';
  if (s === 'NIFTY BANK') return '^NSEBANK';
  if (s === 'SENSEX') return '^BSESN';
  if (s === 'INDIA VIX') return '^INDIAVIX';
  return '';
};

const normalizeSymbol = (value = '') =>
  String(value)
    .replace(/-IN$/i, '')
    .replace(/_/g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();



const normalizeStockDetails = (payload, symbol) => {
  const apiStock = payload?.quote ? payload : payload?.data;
  const fallback = STOCK_MAP[symbol] || { ...FALLBACK, symbol };

  if (!apiStock?.quote) {
    return { ...fallback, symbol };
  }

  const quote = apiStock.quote || {};
  const companyInfo = apiStock.company_info || {};

  return {
    symbol: apiStock.symbol || symbol,
    name: apiStock.name || fallback.name,
    sector: apiStock.sector || fallback.sector,
    exchange: apiStock.exchange || fallback.exchange,
    price: Number(quote.price ?? fallback.price),
    prevClose: Number(quote.previous_close ?? fallback.prevClose),
    open: Number(quote.open ?? fallback.open),
    high: Number(quote.high ?? fallback.high),
    low: Number(quote.low ?? fallback.low),
    volume: Number(quote.volume ?? fallback.volume),
    marketCap: Number(companyInfo.market_cap ?? fallback.marketCap),
    pe: Number(companyInfo.pe_ratio ?? fallback.pe),
    pb: Number(companyInfo.pb_ratio ?? fallback.pb),
    eps: Number(companyInfo.eps ?? fallback.eps),
    div: Number(companyInfo.dividend_yield ?? fallback.div),
    week52H: Number(quote.week_52_high ?? fallback.week52H),
    week52L: Number(quote.week_52_low ?? fallback.week52L),
    lot: Number(companyInfo.lot_size ?? fallback.lot),
  };
};

/* Generate candlestick data */
const generateCandles = (base, n = 120) => {
  let p = base * 0.88;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - i));
    const o = p + (Math.random() - 0.49) * (p * 0.015);
    const c = o + (Math.random() - 0.48) * (p * 0.012);
    const h = Math.max(o, c) + Math.random() * (p * 0.008);
    const l = Math.min(o, c) - Math.random() * (p * 0.008);
    const v = Math.floor(500000 + Math.random() * 2000000);
    p = c;
    return {
      time: Math.floor(d.getTime() / 1000),
      open: +o.toFixed(2), high: +h.toFixed(2),
      low:  +l.toFixed(2), close: +c.toFixed(2),
      value: v,
    };
  });
};

const getIntervalConfig = (uiInterval, marketStatus) => {
  const status = String(marketStatus || '').toLowerCase();
  const marketOpen = status === 'open' || status === 'pre_open';

  if (!marketOpen) {
    return {
      yahooInterval: '1d',
      lookbackDays: 7,
      liveBucketSec: null,
    };
  }

  switch (uiInterval) {
    case '5m':
      return { yahooInterval: '5m', lookbackDays: 7, liveBucketSec: 5 * 60 };
    case '15m':
      return { yahooInterval: '15m', lookbackDays: 14, liveBucketSec: 15 * 60 };
    case '30m':
      return { yahooInterval: '30m', lookbackDays: 21, liveBucketSec: 30 * 60 };
    case '1h':
      return { yahooInterval: '60m', lookbackDays: 30, liveBucketSec: 60 * 60 };
    case '1D':
      return { yahooInterval: '5m', lookbackDays: 7, liveBucketSec: 5 * 60 };
    case '1W':
      return { yahooInterval: '30m', lookbackDays: 14, liveBucketSec: 30 * 60 };
    case '1M':
      return { yahooInterval: '1d', lookbackDays: 35, liveBucketSec: null };
    case '3M':
      return { yahooInterval: '1d', lookbackDays: 100, liveBucketSec: null };
    case '6M':
      return { yahooInterval: '1d', lookbackDays: 200, liveBucketSec: null };
    case '1Y':
      return { yahooInterval: '1d', lookbackDays: 370, liveBucketSec: null };
    default:
      return { yahooInterval: '1d', lookbackDays: 35, liveBucketSec: null };
  }
};

const toUnixSec = (value) => {
  const ms = typeof value === 'number' ? value : Date.parse(String(value || ''));
  if (!ms || Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
};

const toEpochMs = (value) => {
  const numeric = Number(value || 0);
  if (numeric > 0) {
    return numeric > 9_999_999_999 ? numeric : numeric * 1000;
  }
  const parsed = Date.parse(String(value || ''));
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

/* ─── Lightweight Chart wrapper ──────────────── */
const CandlestickChart = ({
  stock,
  interval,
  candles = [],
  liveCandle,
  autoFollow = true,
  followLagSec = 60,
  onAutoFollowChange,
  goToRealtimeSignal = 0,
}) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volRef       = useRef(null);
  const fittedKeyRef = useRef('');
  const autoFollowRef = useRef(autoFollow);
  const latestLiveTimeRef = useRef(null);
  const ignoreRangeEventRef = useRef(false);

  const toRangeSec = (value) => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
      const ms = Date.UTC(value.year, value.month - 1, value.day);
      return Math.floor(ms / 1000);
    }
    return toUnixSec(value);
  };

  useEffect(() => {
    autoFollowRef.current = autoFollow;
  }, [autoFollow]);

  useEffect(() => {
    if (!containerRef.current) return;

    /* Create chart */
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'var(--text-tertiary)',
      },
      grid: {
        vertLines:   { color: 'rgba(255,255,255,0.03)' },
        horzLines:   { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair:    { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 6,
        minBarSpacing: 2,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Ensure initial size is set (container can be 0 during first paint/layout).
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        chart.applyOptions({ width: w, height: h });
      }
    }

    /* Candlestick series */
    const candle = chart.addCandlestickSeries({
      upColor:         '#00E676',
      downColor:       '#FF1744',
      borderUpColor:   '#00E676',
      borderDownColor: '#FF1744',
      wickUpColor:     '#00E676',
      wickDownColor:   '#FF1744',
    });

    /* Volume series */
    const vol = chart.addHistogramSeries({
      priceFormat:     { type: 'volume' },
      priceScaleId:    'volume',
      scaleMargins:    { top: 0.8, bottom: 0 },
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    /* Resize observer */
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          chart.applyOptions({ width: w, height: h });
        }
      }
    });
    ro.observe(containerRef.current);

    chartRef.current  = chart;
    candleRef.current = candle;
    volRef.current    = vol;

    const onVisibleRangeChange = (range) => {
      if (!autoFollowRef.current) return;
      if (ignoreRangeEventRef.current) return;
      if (!range || !latestLiveTimeRef.current) return;

      const visibleToSec = toRangeSec(range.to);
      if (!visibleToSec) return;

      const lagSec = Number(latestLiveTimeRef.current) - Number(visibleToSec);
      const thresholdSec = Math.max(30, Number(followLagSec || 60) * 1.5);
      if (lagSec > thresholdSec) {
        onAutoFollowChange?.(false);
      }
    };

    chart.timeScale().subscribeVisibleTimeRangeChange(onVisibleRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(onVisibleRangeChange);
      ro.disconnect();
      chart.remove();
    };
  }, [stock.symbol, followLagSec, onAutoFollowChange]);

  useEffect(() => {
    if (!candleRef.current || !volRef.current) return;

    const data = Array.isArray(candles) ? candles : [];

    candleRef.current.setData(data);
    volRef.current.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume ?? d.value ?? 0,
        color: d.close >= d.open
          ? 'rgba(0,230,118,0.4)'
          : 'rgba(255,23,68,0.4)',
      }))
    );

    const fitKey = `${stock.symbol}::${interval}::${data.length}`;
    if (chartRef.current && fittedKeyRef.current !== fitKey) {
      fittedKeyRef.current = fitKey;
      chartRef.current.timeScale().fitContent();
    }
  }, [candles, stock?.symbol, interval]);

  useEffect(() => {
    if (!liveCandle || !candleRef.current || !volRef.current) return;
    latestLiveTimeRef.current = liveCandle.time;

    candleRef.current.update(liveCandle);
    volRef.current.update({
      time: liveCandle.time,
      value: liveCandle.volume ?? 0,
      color: liveCandle.close >= liveCandle.open
        ? 'rgba(0,230,118,0.4)'
        : 'rgba(255,23,68,0.4)',
    });

    if (autoFollow && chartRef.current) {
      ignoreRangeEventRef.current = true;
      chartRef.current.timeScale().scrollToRealTime();
      requestAnimationFrame(() => {
        ignoreRangeEventRef.current = false;
      });
    }
  }, [liveCandle, autoFollow]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!goToRealtimeSignal) return;
    ignoreRangeEventRef.current = true;
    chartRef.current.timeScale().scrollToRealTime();
    requestAnimationFrame(() => {
      ignoreRangeEventRef.current = false;
    });
  }, [goToRealtimeSignal]);

  return (
    <div ref={containerRef} className="w-full h-[380px]" />
  );
};

/* ─── Order Form ──────────────────────────────── */
const OrderForm = ({ stock, selectedPrice }) => {
  const [side, setSide]      = useState('buy');
  const [oType, setOType]    = useState('market');
  const [pType, setPType]    = useState('CNC');
  const [submitting, setSub] = useState(false);

  const setHoldings = usePortfolioStore((s) => s.setHoldings);
  const setPositions = usePortfolioStore((s) => s.setPositions);

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { quantity: 1, price: stock.price, trigger_price: '' },
  });

  useEffect(() => {
    if (!selectedPrice) return;
    if (oType === 'market') return;
    setValue('price', Number(selectedPrice));
  }, [selectedPrice, oType, setValue]);

  const qty      = watch('quantity') || 0;
  const price    = watch('price') || stock.price;
  const estValue = qty * (oType === 'market' ? stock.price : price);
  const charges  = +(estValue * 0.0003).toFixed(2);

  const onSubmit = async (data) => {
    try {
      setSub(true);

      const payload = {
        symbol: stock.symbol,
        exchange: 'NSE',
        transaction_type: side.toLowerCase(),
        order_type: oType.toLowerCase(),
        product_type: pType,
        quantity: Number(data.quantity),
        price: oType === 'market' ? stock.price : Number(data.price),
        ...(data.trigger_price && {
          trigger_price: Number(data.trigger_price),
        }),
      };

      console.log('PAYLOAD:', payload);

      const res = await tradingService.placeOrder(payload);

      toast.success(
        `Order placed successfully (${res.data?.status || 'processed'})`
      );

      if (String(res?.data?.status || '').toLowerCase() === 'filled') {
        const [holdingsRes, positionsRes] = await Promise.all([
          tradingService.getHoldings(),
          tradingService.getPositions(),
        ]);
        setHoldings(holdingsRes?.data || []);
        setPositions(positionsRes?.data || []);
      }

      setValue('quantity', 1);
      setValue('price', stock.price);
      setValue('trigger_price', '');
    } catch (err) {
      console.log('FULL ERROR:', err);

      if (err?.response?.data?.errors) {
        err.response.data.errors.forEach((e) => {
          console.log(`❌ ${e.path}: ${e.msg}`);
        });
      }

      toast.error(err?.response?.data?.message || 'Order failed');
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                    rounded-2xl overflow-hidden" style={{padding: '0.25rem',marginBottom: '0.25rem'}}>
      {/* Buy / Sell Toggle */}
      <div className="grid grid-cols-2" style={{marginBottom: '0.25rem'}}>
        <button
          onClick={() => setSide('buy')}
          className={`py-3.5 text-sm font-bold transition-all duration-200 rounded-2xl
                       ${side === 'buy'
                         ? 'bg-[#0052FF] text-white shadow-[0_0_20px_rgba(0,82,255,0.3)]'
                         : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
        >
          <TrendingUp size={16} className="inline mr-1.5" /> BUY
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`py-3.5 text-sm font-bold transition-all duration-200 rounded-2xl
                       ${side === 'sell'
                         ? 'bg-[var(--loss)] text-white shadow-[0_0_20px_rgba(255,23,68,0.3)]'
                         : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
        >
          <TrendingDown size={16} className="inline mr-1.5" /> SELL
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
        {/* Product type */}
        <div className="flex gap-1.5">
          {['CNC','MIS','NRML'].map((pt) => (
            <button
              key={pt}
              type="button"
              onClick={() => setPType(pt)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold
                          border transition-all duration-200
                          ${pType === pt
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                            : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:border-[var(--border-secondary)]'}`}
            >
              {pt}
            </button>
          ))}
        </div>

        {/* Order type */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider
                            text-[var(--text-tertiary)] mb-1 block">
            Order Type
          </label>
          <select
            value={oType}
            onChange={(e) => setOType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm
                       bg-[var(--bg-input)] border border-[var(--border-primary)]
                       text-[var(--text-primary)]
                       focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop_loss">Stop-Loss</option>
            <option value="stop_limit">Stop-Limit</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider
                            text-[var(--text-tertiary)] mb-1 block">
            Quantity
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setValue('quantity', Math.max(1, qty - 1))}
              className="px-3 py-2.5 rounded-l-xl bg-[var(--bg-tertiary)]
                         border border-[var(--border-primary)] border-r-0
                         text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                         transition-colors"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              {...register('quantity', { required:true, min:1, valueAsNumber:true })}
              className="flex-1 px-3 py-2.5 text-center text-sm font-mono
                         bg-[var(--bg-input)] border-y border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]
                         [appearance:textfield]"
            />
            <button
              type="button"
              onClick={() => setValue('quantity', qty + 1)}
              className="px-3 py-2.5 rounded-r-xl bg-[var(--bg-tertiary)]
                         border border-[var(--border-primary)] border-l-0
                         text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                         transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

        </div>

        {/* Price (limit / SL) */}
        {oType !== 'market' && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider
                              text-[var(--text-tertiary)] mb-1 block">
              Limit Price (₹)
            </label>
            <input
              type="number"
              step="0.05"
              {...register('price', { required: oType !== 'market', min:0.01, valueAsNumber:true })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono
                         bg-[var(--bg-input)] border border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        )}

        {/* Trigger (SL) */}
        {(oType === 'stop_loss' || oType === 'stop_limit') && (
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider
                              text-[var(--text-tertiary)] mb-1 block">
              Trigger Price (₹)
            </label>
            <input
              type="number"
              step="0.05"
              {...register('trigger_price', { required:true, min:0.01, valueAsNumber:true })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono
                         bg-[var(--bg-input)] border border-[var(--border-primary)]
                         text-[var(--text-primary)]
                         focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        )}

        {/* Value estimate */}
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]
                        border border-[var(--border-primary)] space-y-1.5" style={{padding: '0.25rem'}}>
          {[
            { label:'Est. Value', value: formatINR(estValue) },
            { label:'Charges',   value: `~${formatINR(charges)}` },
            { label:'Net Amount', value: formatINR(
                side === 'buy' ? estValue + charges : estValue - charges
              )},
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-[var(--text-tertiary)]">{label}</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: submitting ? 1 : 1.02 }}
          whileTap={{ scale: submitting ? 1 : 0.98 }}
          className={`w-full py-3.5 rounded-xl font-bold text-sm text-white
                       disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2
                       transition-all duration-300
                       ${side === 'buy'
                         ? 'bg-[#0052FF] hover:bg-[#0066FF] shadow-[0_0_20px_rgba(0,82,255,0.25)] hover:shadow-[0_0_30px_rgba(0,82,255,0.4)]'
                         : 'bg-[var(--loss)] hover:bg-red-700 shadow-[0_0_20px_rgba(255,23,68,0.25)]'}`}
        >
          {submitting
            ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
            : <>{side === 'buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
               Place {side.toUpperCase()} Order</>
          }
        </motion.button>

        <p className="text-[10px] text-center text-[var(--text-tertiary)]">
          📄 Paper Trade — No real money involved
        </p>
      </form>
    </div>
  );
};
/* MAIN STOCK DETAIL PAGE */
const StockDetail = () => {
  const { symbol: rawSymbol } = useParams();
  const symbol = decodeURIComponent(rawSymbol || '');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [watchlisted, setWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const watchlistCtxRef = useRef({ watchlistId: null, itemId: null });

  const unwrapApiData = (res) => res?.data?.data ?? res?.data ?? res;
  const [marketStatus, setMarketStatus] = useState({ status: 'closed' });
  const [chartCandles, setChartCandles] = useState([]);
  const [chartLiveCandle, setChartLiveCandle] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const { symbol: cleanSymbol } = useParams();
  const indexSubscriptionItems = isIndexSymbol(symbol)
    ? [cleanSymbol]
    : [];
  const subscriptionPayload = {
    symbols: symbol && !isIndexSymbol(symbol) ? [symbol] : [],
    indices: indexSubscriptionItems,
  };
  useMarketSubscription({
    ...subscriptionPayload,
    enabled: Boolean(symbol),
  });

  // Market store selectors and local UI state (was missing causing reference errors)
  const orderBooksByKey = useMarketStore((s) => s.orderBooksByKey);
  const depthByKey = useMarketStore((s) => s.depthByKey);
  const ticksByKey = useMarketStore((s) => s.ticksByKey);

  const [stock, setStock] = useState(null);
  const [interval, setUiInterval] = useState('1D');
  const [autoFollowLive, setAutoFollowLive] = useState(true);
  const [goToRealtimeSignal, setGoToRealtimeSignal] = useState(0);
  const [infoTab, setInfoTab] = useState('overview');
  const [selectedPrice, setSelectedPrice] = useState(null);

  const liveAggRef = useRef(null);
  const pendingLiveCandleRef = useRef(null);
  const liveCandleRafRef = useRef(0);

  const l2Symbol = useMemo(() => {
    if (!symbol) return '';
    if (isIndexSymbol(symbol)) return toYahooIndexSymbol(symbol) || toIndexDisplaySymbol(symbol);
    const raw = String(symbol).toUpperCase();
    if (raw.includes('.NS') || raw.includes('.BO') || raw.startsWith('^')) return raw;
    return `${raw}.NS`;
  }, [symbol]);

  const liveTick = useMemo(() => {
    if (!ticksByKey) return null;

    // Fast-path for exact socket/store key.
    if (ticksByKey[l2Symbol]) return ticksByKey[l2Symbol];

    // Fallback for mixed key formats (e.g. RELIANCE vs RELIANCE.NS).
    const targetKey = normalizeSymbol(symbol);
    return Object.values(ticksByKey).find((tick) => {
      const symbolKey = normalizeSymbol(tick?.symbol || '');
      const displayKey = normalizeSymbol(tick?.displaySymbol || '');
      const storeKey = normalizeSymbol(tick?.key || '');
      return symbolKey === targetKey || displayKey === targetKey || storeKey === targetKey;
    }) || null;
  }, [ticksByKey, l2Symbol, symbol]);

  const isPriceLive = useMemo(() => {
    const status = String(marketStatus?.status || '').toLowerCase();
    const marketOpen = status === 'open' || status === 'pre_open';
    const tickTs = toEpochMs(liveTick?.timestamp || liveTick?.time || 0);
    const recentTick = Date.now() - tickTs <= 15_000;
    return marketOpen && recentTick;
  }, [marketStatus?.status, liveTick]);

  const hasRecentTick = useMemo(() => {
    const tickTs = toEpochMs(liveTick?.timestamp || liveTick?.time || 0);
    return Date.now() - tickTs <= 30_000;
  }, [liveTick]);

  const book = orderBooksByKey?.[l2Symbol] || null;

  useEffect(() => {
    let mounted = true;

    const loadMarketStatus = async () => {
      try {
        const res = await tradingService.getMarketStatus();
        const statusPayload = res?.data?.data || res?.data;
        if (!mounted) return;
        setMarketStatus(statusPayload || { status: 'closed' });
      } catch (_) {
        if (!mounted) return;
        setMarketStatus({ status: 'closed' });
      }
    };

    loadMarketStatus();
    const id = window.setInterval(loadMarketStatus, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const intervalConfig = useMemo(() => {
    const effectiveStatus = hasRecentTick ? 'open' : marketStatus?.status;
    return getIntervalConfig(interval, effectiveStatus);
  }, [interval, marketStatus?.status, hasRecentTick]);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        if (!symbol) return;

        if (mounted) {
          setHistoryLoading(true);
          setHistoryError('');
        }

        const historySymbol = isIndexSymbol(symbol)
          ? toIndexDisplaySymbol(symbol)
          : symbol;

        const end = new Date();
        const start = new Date(Date.now() - intervalConfig.lookbackDays * 24 * 60 * 60 * 1000);

        const res = await tradingService.getStockHistory(historySymbol, {
          start: start.toISOString(),
          end: end.toISOString(),
          interval: intervalConfig.yahooInterval,
        });

        const candles = res?.data?.data?.candles || res?.data?.candles || [];
        const mapped = (candles || [])
          .map((c) => {
            const t = toUnixSec(c.time || c.date);
            if (!t) return null;
            return {
              time: t,
              open: Number(c.open || 0),
              high: Number(c.high || 0),
              low: Number(c.low || 0),
              close: Number(c.close || 0),
              volume: Number(c.volume || 0),
            };
          })
          .filter(Boolean);

        if (!mounted) return;
        setChartCandles(mapped);
        if (!mapped.length) {
          setHistoryError('No historical data available for this symbol.');
        }
      } catch (e) {
        if (!mounted) return;
        setChartCandles([]);
        setHistoryError('Failed to load historical data.');
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [symbol, intervalConfig.yahooInterval, intervalConfig.lookbackDays]);

  useEffect(() => {
    let mounted = true;

    const loadStock = async () => {
      try {
        setLoading(true);

        if (isIndexSymbol(symbol)) {
          const indexDisplay = toIndexDisplaySymbol(symbol);

          // Set a minimal placeholder immediately; real OHLCV comes from Yahoo quote + history.
          if (mounted) {
            setStock({
              ...FALLBACK,
              symbol: indexDisplay,
              name: indexDisplay,
              sector: 'Index',
              exchange: 'NSE',
            });
          }

          try {
            const qRes = await tradingService.getStockQuote(indexDisplay);
            if (!mounted) return;

            const normalized = normalizeStockDetails(qRes, indexDisplay);
            setStock((prev) => ({
              ...(prev || {}),
              ...normalized,
              symbol: indexDisplay,
              name: indexDisplay,
              sector: 'Index',
              exchange: normalized.exchange || 'NSE',
            }));
          } catch (_) {
            // Keep placeholder; history loader will still populate chart.
          }
          return;
        }

        try {
          const response = await tradingService.getStockDetails(symbol);
          if (!mounted) return;
          setStock(normalizeStockDetails(response, symbol));
        } catch (_) {
          // Fallback: quote endpoint is usually more reliable than details.
          const qRes = await tradingService.getStockQuote(symbol);
          if (!mounted) return;
          setStock(normalizeStockDetails(qRes, symbol));
        }
      } catch (error) {
        console.error('❌ Failed to load stock details:', error);

        if (!mounted) return;

        const fallback = STOCK_MAP[symbol] || {
          ...FALLBACK,
          symbol,
          ...(isIndexSymbol(symbol)
            ? {
                name: String(symbol).replace(/_/g, ' '),
                sector: 'Index',
                exchange: 'NSE',
              }
            : {}),
        };

        setStock(fallback);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStock();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  useEffect(() => {
    let mounted = true;

    const ensureDefaultWatchlist = async () => {
      const res = await tradingService.getWatchlists();
      const wls = unwrapApiData(res) || [];

      if (Array.isArray(wls) && wls.length > 0) return wls;

      await tradingService.createWatchlist({ name: 'My Watchlist', color: '#0052FF' });
      const res2 = await tradingService.getWatchlists();
      return unwrapApiData(res2) || [];
    };

    const loadWatchlistState = async () => {
      try {
        setWatchlistLoading(true);
        const wls = await ensureDefaultWatchlist();
        if (!mounted) return;

        const list = Array.isArray(wls) ? wls : [];
        const defaultWl = list.find((w) => w?.is_default) || list[0] || null;
        const items = defaultWl?.items || [];
        const symKey = String(symbol || '').trim().toUpperCase();

        const existing = Array.isArray(items)
          ? items.find((it) => String(it?.symbol || '').trim().toUpperCase() === symKey)
          : null;

        watchlistCtxRef.current = {
          watchlistId: defaultWl?.id || null,
          itemId: existing?.id || null,
        };
        setWatchlisted(Boolean(existing));
      } catch (_) {
        if (!mounted) return;
        watchlistCtxRef.current = { watchlistId: null, itemId: null };
        setWatchlisted(false);
      } finally {
        if (!mounted) return;
        setWatchlistLoading(false);
      }
    };

    if (symbol) loadWatchlistState();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  useEffect(() => {
    if (!liveTick) return;

    setStock((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        price: Number(liveTick.price ?? prev.price),
        prevClose: Number(liveTick.close ?? prev.prevClose),
        open: Number(liveTick.open ?? prev.open),
        high: Number(liveTick.high ?? prev.high),
        low: Number(liveTick.low ?? prev.low),
        volume: Number(liveTick.volume ?? prev.volume),
      };
    });
  }, [liveTick, symbol]);

  const toggleWatchlist = async () => {
    const symKey = String(symbol || '').trim();
    if (!symKey) return;

    const { watchlistId, itemId } = watchlistCtxRef.current || {};
    if (!watchlistId) {
      toast.error('No watchlist available');
      return;
    }

    const resolveItemId = async () => {
      const res = await tradingService.getWatchlists();
      const list = unwrapApiData(res) || [];
      const wls = Array.isArray(list) ? list : [];
      const wl = wls.find((w) => w?.id === watchlistId) || wls.find((w) => w?.is_default) || wls[0] || null;
      const items = wl?.items || [];
      const target = String(symKey).trim().toUpperCase();
      const found = Array.isArray(items)
        ? items.find((it) => String(it?.symbol || '').trim().toUpperCase() === target)
        : null;
      return { watchlistId: wl?.id || watchlistId || null, itemId: found?.id || null };
    };

    try {
      setWatchlistLoading(true);

      if (watchlisted) {
        let effectiveItemId = itemId;
        let effectiveWatchlistId = watchlistId;

        if (!effectiveItemId) {
          const resolved = await resolveItemId();
          effectiveItemId = resolved.itemId;
          effectiveWatchlistId = resolved.watchlistId;
        }

        if (!effectiveItemId) {
          watchlistCtxRef.current = { watchlistId: effectiveWatchlistId, itemId: null };
          setWatchlisted(false);
          toast.error('Watchlist item not found');
          return;
        }

        try {
          await tradingService.removeFromWatchlist(effectiveWatchlistId, effectiveItemId);
        } catch (err) {
          const msg = String(err?.message || '');
          if (msg.toLowerCase().includes('watchlist item not found')) {
            const resolved = await resolveItemId();
            if (resolved?.itemId) {
              await tradingService.removeFromWatchlist(resolved.watchlistId, resolved.itemId);
              effectiveWatchlistId = resolved.watchlistId;
            } else {
              watchlistCtxRef.current = { watchlistId: effectiveWatchlistId, itemId: null };
              setWatchlisted(false);
              toast.error('Watchlist item not found');
              return;
            }
          } else {
            throw err;
          }
        }

        watchlistCtxRef.current = { watchlistId: effectiveWatchlistId, itemId: null };
        setWatchlisted(false);
        toast.success(`${symbol} removed from watchlist`);
        return;
      }

      const payload = {
        symbol: symKey,
        exchange: stock?.exchange || 'NSE',
        stock_name: stock?.name || null,
      };
      const created = await tradingService.addToWatchlist(watchlistId, payload);
      const createdItem = unwrapApiData(created);
      const newItemId = createdItem?.id || null;
      watchlistCtxRef.current = { watchlistId, itemId: newItemId };
      setWatchlisted(true);
      toast.success(`${symbol} added to watchlist`);
    } catch (e) {
      toast.error(e?.message || 'Failed to update watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

useEffect(() => {
  if (!isIndexSymbol(symbol)) return;
  if (!chartCandles?.length) return;

  const last = chartCandles[chartCandles.length - 1];
  const prev = chartCandles[chartCandles.length - 2];
  if (!last) return;

  setStock((s) => {
    if (!s) return s;

    return {
      ...s,
      prevClose: Number(prev?.close ?? s.prevClose),
      open: Number(last.open ?? s.open),
      high: Number(last.high ?? s.high),
      low: Number(last.low ?? s.low),
      volume: Number(last.volume ?? s.volume),
      price: Number(s.price ?? last.close ?? s.price),
    };
  });
}, [symbol, chartCandles]);

  useEffect(() => {
    const status = String(marketStatus?.status || '').toLowerCase();
    const marketOpen = status === 'open' || status === 'pre_open' || hasRecentTick;

    if (!marketOpen || !intervalConfig.liveBucketSec || !liveTick?.price) {
      liveAggRef.current = null;
      pendingLiveCandleRef.current = null;
      if (liveCandleRafRef.current) {
        cancelAnimationFrame(liveCandleRafRef.current);
        liveCandleRafRef.current = 0;
      }
      setChartLiveCandle(null);
      return;
    }

    const tsMs = toEpochMs(liveTick.timestamp || liveTick.time || Date.now());
    const bucketMs = Math.floor(tsMs / (intervalConfig.liveBucketSec * 1000)) * (intervalConfig.liveBucketSec * 1000);
    const candleTime = Math.floor(bucketMs / 1000);
    const price = Number(liveTick.price ?? liveTick.ltp ?? liveTick.last_price ?? liveTick.close ?? 0);
    if (!Number.isFinite(price) || price <= 0) return;

    const prev = liveAggRef.current;

    if (!prev || prev.time !== candleTime) {
      liveAggRef.current = {
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: Number(liveTick.volume || 0),
      };
    } else {
      liveAggRef.current = {
        ...prev,
        high: Math.max(prev.high, price),
        low: Math.min(prev.low, price),
        close: price,
        volume: Number(liveTick.volume || prev.volume || 0),
      };
    }

    // Batch chart updates to animation frames to avoid jitter and excessive renders.
    pendingLiveCandleRef.current = liveAggRef.current;
    if (!liveCandleRafRef.current) {
      liveCandleRafRef.current = requestAnimationFrame(() => {
        liveCandleRafRef.current = 0;
        const next = pendingLiveCandleRef.current;
        if (next) setChartLiveCandle(next);
      });
    }
  }, [liveTick, marketStatus?.status, intervalConfig.liveBucketSec, hasRecentTick]);



  const change    = stock ? stock.price - stock.prevClose : 0;
  const changePct = stock ? (change / stock.prevClose) * 100 : 0;
  const isUp      = change >= 0;

  const INFO_TABS = [
    { key:'overview',      label:'Overview'     },
    { key:'fundamentals',  label:'Fundamentals' },
    { key:'depth',         label:'Market Depth' },
    { key:'news',          label:'News'         },
  ];

  const INTERVALS = ['5m', '15m', '30m', '1h', '1D', '1W', '1M', '3M', '6M', '1Y'];

  /* live market depth */
  const liveDepthEntry = useMemo(() => (
    Object.values(depthByKey || {}).find((entry) => {
      const depthKey = normalizeSymbol(entry.symbol || entry.displaySymbol || '');
      const pageKey = normalizeSymbol(symbol);
      return depthKey === pageKey;
    })
  ), [depthByKey, symbol]);



  const depth = liveDepthEntry
    ? {
        bids: Array.isArray(liveDepthEntry.buy)
          ? liveDepthEntry.buy.map((b) => ({
              price: Number(b.price || 0),
              qty: Number(b.quantity || 0),
              orders: Number(b.orders || 0),
            }))
          : [],
        asks: Array.isArray(liveDepthEntry.sell)
          ? liveDepthEntry.sell.map((a) => ({
              price: Number(a.price || 0),
              qty: Number(a.quantity || 0),
              orders: Number(a.orders || 0),
            }))
          : [],
      }
    : {
        bids: [
          { price:1285.00, qty:500,  orders:12 },
          { price:1284.50, qty:1200, orders:28 },
          { price:1284.00, qty:800,  orders:15 },
          { price:1283.50, qty:2000, orders:42 },
          { price:1283.00, qty:650,  orders:9  },
        ],
        asks: [
          { price:1285.50, qty:400,  orders:8  },
          { price:1286.00, qty:900,  orders:21 },
          { price:1286.50, qty:1500, orders:35 },
          { price:1287.00, qty:600,  orders:11 },
          { price:1287.50, qty:1100, orders:26 },
        ],
      };

  return (
    <div className="space-y-4">

      {/* ── Back & Title ──────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[var(--bg-card)]
                     border border-[var(--border-primary)]
                     text-[var(--text-secondary)]
                     hover:text-[var(--text-primary)]
                     hover:border-[var(--border-secondary)]
                     transition-all duration-200"
        >
          <ArrowLeft size={18}/>
        </button>

        {loading ? (
          <Skeleton className="h-8 w-64"/>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-bold
                               text-[var(--text-primary)]">
                  {stock.symbol}
                </h1>
                <Badge variant="NSE" size="sm">{stock.exchange}</Badge>
                <Badge variant="CNC" size="sm">{stock.sector}</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {stock.name}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 ml-2">
              <span className="text-3xl font-mono font-bold
                               text-[var(--text-primary)]">
                {formatINR(stock.price)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                  isPriceLive
                    ? 'text-[var(--profit)] border-[var(--profit)]/40 bg-[var(--profit)]/10'
                    : 'text-[var(--text-tertiary)] border-[var(--border-primary)] bg-[var(--bg-tertiary)]'
                }`}
              >
                {isPriceLive ? 'Live' : 'Delayed'}
              </span>
              <span className={`flex items-center gap-1 text-sm
                               font-mono font-semibold ${getPnLColor(change)}`}>
                {isUp ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                {change >= 0 ? '+' : ''}{change.toFixed(2)}
                {' '}({formatPercent(changePct)})
              </span>
            </div>

            {/* Watchlist toggle */}
            <button
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
              className="ml-auto p-2 rounded-xl bg-[var(--bg-card)]
                         border border-[var(--border-primary)]
                         transition-all duration-200
                         hover:border-amber-500/50"
            >
              {watchlisted
                ? <Star size={18} className="text-amber-400 fill-amber-400"/>
                : <StarOff size={18} className="text-[var(--text-tertiary)]"/>}
            </button>
          </div>
        )}
      </div>

      {/* ── Main Layout ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Chart area (2/3) ──────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Chart card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                          rounded-xl overflow-hidden" style={{padding: '0.25rem'}}>
            {/* Interval selector */}
            <div className="flex items-center justify-between px-5 py-3
                            border-b border-[var(--border-primary)]">
              <div className="flex gap-1">
                {INTERVALS.map((iv) => (
                  <button key={iv}
                    onClick={() => setUiInterval(iv)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold
                               transition-all duration-200
                               ${interval === iv
                                 ? 'bg-[var(--accent-primary)] text-white'
                                 : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
                    {iv}
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={() => setAutoFollowLive((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all duration-200 ${
                    autoFollowLive
                      ? 'text-[var(--accent-primary)] border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10'
                      : 'text-[var(--text-tertiary)] border-[var(--border-primary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {autoFollowLive ? 'Follow: On' : 'Follow: Off'}
                </button>
                {!autoFollowLive && (
                  <button
                    onClick={() => {
                      setAutoFollowLive(true);
                      setGoToRealtimeSignal((v) => v + 1);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all duration-200 text-[var(--profit)] border-[var(--profit)]/40 bg-[var(--profit)]/10 hover:bg-[var(--profit)]/15"
                  >
                    Go to realtime
                  </button>
                )}
                <div className="flex gap-4 text-xs font-mono text-[var(--text-tertiary)]">
                {stock && [
                  { l:'O', v: stock.open  },
                  { l:'H', v: stock.high  },
                  { l:'L', v: stock.low   },
                  { l:'C', v: stock.price },
                ].map(({ l, v }) => (
                  <span key={l}>
                    <span className="text-[var(--text-tertiary)]">{l}: </span>
                    <span className="text-[var(--text-primary)] font-semibold">
                      {v?.toFixed(2)}
                    </span>
                  </span>
                ))}
                </div>
              </div>
            </div>

            <div className="p-2">
              {loading || historyLoading
                ? <Skeleton className="h-96 w-full rounded-xl"/>
                : (
                  <div className="relative">
                    <CandlestickChart
                      stock={stock}
                      interval={interval}
                      candles={chartCandles}
                      liveCandle={chartLiveCandle}
                      autoFollow={autoFollowLive}
                      followLagSec={intervalConfig.liveBucketSec || 60}
                      onAutoFollowChange={setAutoFollowLive}
                      goToRealtimeSignal={goToRealtimeSignal}
                    />

                    {!chartCandles?.length && !chartLiveCandle && !hasRecentTick && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] bg-[var(--bg-card)]/70 px-4 py-2 rounded-xl border border-[var(--border-primary)]">
                          <AlertCircle className="w-4 h-4" />
                          <span>{historyError || 'No data to display.'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          </div>

          {/* Info tabs */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                          rounded-xl overflow-hidden" style={{padding: '0.25rem'}}>
            {/* Tab nav */}
            <div className="flex border-b border-[var(--border-primary)]
                            overflow-x-auto scrollbar-none" style={{gap:"0.5rem"}}>
              {INFO_TABS.map((tab) => (
                <button key={tab.key}
                  onClick={() => setInfoTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap
                             border-b-2 transition-all duration-200
                             ${infoTab === tab.key
                               ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                               : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Overview */}
              {infoTab === 'overview' && stock && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label:'Previous Close', value: formatINR(stock.prevClose) },
                    { label:'Open',           value: formatINR(stock.open)      },
                    { label:'Day High',       value: formatINR(stock.high),
                      color: 'text-[var(--profit)]' },
                    { label:'Day Low',        value: formatINR(stock.low),
                      color: 'text-[var(--loss)]'   },
                    { label:'Volume',         value: formatVolume(stock.volume) },
                    { label:'52W High',       value: formatINR(stock.week52H),
                      color: 'text-[var(--profit)]' },
                    { label:'52W Low',        value: formatINR(stock.week52L),
                      color: 'text-[var(--loss)]'   },
                    { label:'Lot Size',       value: stock.lot               },
                    { label:'Market Cap',     value: formatINR(stock.marketCap, { compact:true }) },
                  ].map(({ label, value, color }) => (
                    <div key={label}
                         className="p-3 rounded-xl bg-[var(--bg-tertiary)]
                                    border border-[var(--border-primary)]" style={{padding: '0.25rem'}}>
                      <p className="text-[10px] text-[var(--text-tertiary)]
                                    uppercase tracking-wider mb-1">{label}</p>
                      <p className={`text-sm font-mono font-semibold
                                     ${color || 'text-[var(--text-primary)]'}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Fundamentals */}
              {infoTab === 'fundamentals' && stock && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label:'P/E Ratio',    value: stock.pe?.toFixed(2)  ?? 'N/A' },
                    { label:'P/B Ratio',    value: stock.pb?.toFixed(2)  ?? 'N/A' },
                    { label:'EPS (₹)',      value: stock.eps?.toFixed(2) ?? 'N/A' },
                    { label:'Div Yield %',  value: stock.div?.toFixed(2) ?? 'N/A' },
                    { label:'Market Cap',   value: formatINR(stock.marketCap, { compact:true }) },
                    { label:'52W Range',    value: `${formatINR(stock.week52L)} – ${formatINR(stock.week52H)}` },
                    { label:'Exchange',     value: stock.exchange },
                    { label:'Sector',       value: stock.sector   },
                  ].map(({ label, value }) => (
                    <div key={label}
                         className="p-3 rounded-xl bg-[var(--bg-tertiary)]
                                    border border-[var(--border-primary)]" style={{padding: '0.25rem'}}>
                      <p className="text-[10px] text-[var(--text-tertiary)]
                                    uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-mono font-semibold
                                    text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Market Depth */}
              {infoTab === 'depth' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Bids */}
                  <div>
                    <p className="text-xs font-bold text-[var(--profit)]
                                  uppercase tracking-wider mb-2">
                      Bids (Buy)
                    </p>
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr>
                          {['Orders','Qty','Price'].map((h) => (
                            <th key={h}
                                className="text-[10px] uppercase tracking-wider
                                           text-[var(--text-tertiary)] pb-1
                                           font-semibold text-right first:text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {depth.bids.map((b, i) => (
                          <tr key={i}
                              className="border-t border-[var(--border-primary)]">
                            <td className="py-1.5 text-[var(--text-tertiary)]">
                              {b.orders}
                            </td>
                            <td className="py-1.5 text-right text-[var(--text-primary)]">
                              {b.qty.toLocaleString('en-IN')}
                            </td>
                            <td className="py-1.5 text-right font-semibold
                                           text-[var(--profit)]">
                              {b.price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Asks */}
                  <div>
                    <p className="text-xs font-bold text-[var(--loss)]
                                  uppercase tracking-wider mb-2">
                      Asks (Sell)
                    </p>
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr>
                          {['Price','Qty','Orders'].map((h) => (
                            <th key={h}
                                className="text-[10px] uppercase tracking-wider
                                           text-[var(--text-tertiary)] pb-1
                                           font-semibold text-left last:text-right">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {depth.asks.map((a, i) => (
                          <tr key={i}
                              className="border-t border-[var(--border-primary)]">
                            <td className="py-1.5 font-semibold text-[var(--loss)]">
                              {a.price.toFixed(2)}
                            </td>
                            <td className="py-1.5 text-center text-[var(--text-primary)]">
                              {a.qty.toLocaleString('en-IN')}
                            </td>
                            <td className="py-1.5 text-right text-[var(--text-tertiary)]">
                              {a.orders}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* News */}
              {infoTab === "news" && <NewsTab symbol={symbol} />}
            </div>
          </div>

          <OrderBook
            title="Live Order Book"
            bids={book?.bids || []}
            asks={book?.asks || []}
            onPriceSelect={(price) => setSelectedPrice(price)}
          />
        </div>

        {/* ── Order Form (1/3) ──────────────── */}
        <div className="space-y-4" style={{padding: '0.25rem'}}>
          <div className="hidden xl:block">
            <MiniOrderBookSidebar currentSymbol={symbol} />
          </div>

          {loading
            ? <Skeleton className="h-[500px] rounded-2xl"/>
            : <OrderForm stock={stock} selectedPrice={selectedPrice} />
          }

          {/* Quick Stats */}
          {!loading && stock && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                            rounded-xl p-4" style={{padding: '0.25rem'}}>
              <h3 className="text-xs font-bold uppercase tracking-wider
                             text-[var(--text-tertiary)] mb-3">
                52-Week Range
              </h3>
              {/* Range bar */}
              <div className="relative h-1.5 bg-[var(--bg-tertiary)]
                              rounded-full mb-2">
                <div
                  className="absolute top-0 left-0 h-full rounded-full
                             bg-gradient-to-r from-[var(--loss)] to-[var(--profit)]"
                  style={{
                    width: "100%",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3
                             rounded-full bg-white border-2 border-[var(--accent-primary)]
                             shadow-[0_0_6px_rgba(0,82,255,0.5)]"
                  style={{
                    left: `calc(${((stock.price - stock.week52L) /
                              (stock.week52H - stock.week52L)) * 100}% - 6px)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--loss)]">
                  {formatINR(stock.week52L)}
                </span>
                <span className="text-[var(--text-tertiary)]">LTP</span>
                <span className="text-[var(--profit)]">
                  {formatINR(stock.week52H)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetail;