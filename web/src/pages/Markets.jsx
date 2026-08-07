import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Activity, RefreshCw,
  Search, ArrowUpRight, ArrowDownRight, BarChart3,
  Flame, ChevronRight, Globe, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from 'recharts';
import { formatINR, formatPercent, getPnLColor } from '@/utils/formatters';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import useMarketStore from '@/store/marketStore';
import useMarketSubscription from '@/hooks/useMarketSubscription';
import tradingService from '@/services/tradingService';



/* ─── Mock Data ───────────────────────────────── */
const INDICES = [
  { symbol:'NIFTY_50',    name:'NIFTY 50',           value:23519.35, change:142.65,  pct: 0.61, open:23410.00, high:23562.80, low:23387.45, vol:'—',       exchange:'NSE' },
  { symbol:'SENSEX',      name:'S&P BSE SENSEX',      value:77341.08, change:498.24,  pct: 0.65, open:76980.00, high:77489.50, low:76845.20, vol:'—',       exchange:'BSE' },
  { symbol:'BANK_NIFTY',  name:'NIFTY Bank',          value:50892.45, change:-187.30, pct:-0.37, open:51100.00, high:51238.90, low:50724.60, vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_IT',    name:'NIFTY IT',            value:37284.90, change:312.50,  pct: 0.84, open:37010.00, high:37390.20, low:36980.50, vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_PHARMA',name:'NIFTY Pharma',        value:18942.30, change: 88.70,  pct: 0.47, open:18880.00, high:18985.60, low:18820.40, vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_AUTO',  name:'NIFTY Auto',          value:21876.55, change:-145.20, pct:-0.66, open:22010.00, high:22098.30, low:21820.70, vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_FMCG',  name:'NIFTY FMCG',         value:54328.40, change:234.80,  pct: 0.43, open:54120.00, high:54480.90, low:54010.30, vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_METAL', name:'NIFTY Metal',         value:8934.60,  change:-98.40,  pct:-1.09, open:9040.00, high:9055.20,  low:8890.30,  vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_REALTY',name:'NIFTY Realty',        value:1042.75,  change: 18.35,  pct: 1.79, open:1025.00, high:1048.90,  low:1021.60,  vol:'—',       exchange:'NSE' },
  { symbol:'INDIA_VIX',   name:'India VIX',           value:13.42,    change: -0.58,  pct:-4.14, open:14.02,   high:14.18,    low:13.38,    vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_PSU_BANK',name:'NIFTY PSU Bank',   value:6218.35,  change: 72.40,  pct: 1.18, open:6150.00, high:6245.80,  low:6138.20,  vol:'—',       exchange:'NSE' },
  { symbol:'NIFTY_MIDCAP_50',name:'NIFTY Midcap 50', value:15842.60, change:188.90,  pct: 1.21, open:15680.00,high:15889.40, low:15650.30, vol:'—',       exchange:'NSE' },
];

const GAINERS = [
  { symbol:'RELIANCE',  name:'Reliance Industries',   price:1285.50, change:12.35,  pct:0.97,  vol:'45.2L'  },
  { symbol:'SUNPHARMA', name:'Sun Pharmaceutical',    price:1812.30, change:24.50,  pct:1.37,  vol:'18.6L'  },
  { symbol:'BHARTIARTL',name:'Bharti Airtel',         price:1628.75, change:22.30,  pct:1.39,  vol:'22.4L'  },
  { symbol:'NESTLEIND', name:'Nestle India',          price:2486.30, change:47.80,  pct:1.96,  vol:'3.8L'   },
  { symbol:'APOLLOHOSP',name:'Apollo Hospitals',      price:6842.50, change:156.40, pct:2.34,  vol:'8.1L'   },
  { symbol:'NIFTY_REALTY',name:'NIFTY Realty',        price:1042.75, change:18.35,  pct:1.79,  vol:'—'      },
];

const LOSERS = [
  { symbol:'TATAMOTORS',name:'Tata Motors',           price:738.90,  change:-12.55, pct:-1.67, vol:'88.4L'  },
  { symbol:'WIPRO',     name:'Wipro Ltd',             price:472.65,  change:-3.10,  pct:-0.65, vol:'38.2L'  },
  { symbol:'NIFTY_METAL',name:'NIFTY Metal',          price:8934.60, change:-98.40, pct:-1.09, vol:'—'      },
  { symbol:'HDFCLIFE',  name:'HDFC Life Insurance',   price:628.45,  change:-8.90,  pct:-1.40, vol:'15.6L'  },
  { symbol:'NIFTY_AUTO',name:'NIFTY Auto',            price:21876.55,change:-145.20,pct:-0.66, vol:'—'      },
  { symbol:'JSWSTEEL',  name:'JSW Steel',             price:924.30,  change:-18.60, pct:-1.97, vol:'24.8L'  },
];

const ACTIVE = [
  { symbol:'SBIN',     name:'State Bank of India',   price:812.40,  change:6.85,   pct:0.85,  vol:'1.2Cr' },
  { symbol:'TATAMOTORS',name:'Tata Motors',          price:738.90,  change:-12.55, pct:-1.67, vol:'88.4L' },
  { symbol:'RELIANCE', name:'Reliance Industries',   price:1285.50, change:12.35,  pct:0.97,  vol:'45.2L' },
  { symbol:'ICICIBANK',name:'ICICI Bank',            price:1289.45, change:-5.20,  pct:-0.40, vol:'42.6L' },
  { symbol:'HDFCBANK', name:'HDFC Bank',             price:1672.30, change:15.60,  pct:0.94,  vol:'38.9L' },
  { symbol:'ITC',      name:'ITC Ltd',              price:442.85,  change:3.70,   pct:0.84,  vol:'1.1Cr' },
];

const COMMODITIES_TOP = [
  { symbol: 'GC=F', name: 'Gold (Futures)' },
  { symbol: 'SI=F', name: 'Silver (Futures)' },
  { symbol: 'CL=F', name: 'Crude Oil (WTI)' },
  { symbol: 'NG=F', name: 'Natural Gas' },
];

/* mini spark line */
const generateSpark = (up) =>
  Array.from({ length: 12 }, (_, i) => ({
    v: 100 + (up ? i * 2 : -i * 2) + (Math.random() * 8 - 4),
  }));

/* ─── Index Card ─────────────────────────────── */
const IndexCard = ({ idx, onClick }) => {
  const up    = idx.pct >= 0;
  const spark = generateSpark(up);

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                 rounded-md p-6 cursor-pointer hover:border-[var(--border-secondary)]
                 transition-all duration-300 overflow-hidden relative group" style={{padding: 10}}
    >
      {/* subtle top gradient line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px]
                       ${up ? 'bg-[var(--profit)]' : 'bg-[var(--loss)]'}
                       opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[var(--text-tertiary)] mb-0.5 font-mono
                        uppercase tracking-wider">
            {idx.exchange}
          </p>
          <p className="text-sm font-heading font-semibold
                        text-[var(--text-primary)] leading-tight">
            {idx.name}
          </p>
        </div>
        <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg
                          text-xs font-mono font-semibold
                          ${up
                            ? 'bg-[var(--profit-bg)] text-[var(--profit)]'
                            : 'bg-[var(--loss-bg)] text-[var(--loss)]'}`}>
          {up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
          {formatPercent(idx.pct)}
        </span>
      </div>

      <p className="text-xl font-mono font-bold text-[var(--text-primary)] mb-1">
        {(idx.value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
      <p className={`text-xs font-mono ${getPnLColor(idx.change)}`}>
        {idx.change >= 0 ? '+' : ''}{(idx.change ?? 0).toFixed(2)}
      </p>

      {/* Spark line */}
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top:2, right:0, left:0, bottom:0 }}>
            <defs>
              <linearGradient id={`sg-${idx.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"
                  stopColor={up ? 'var(--profit)' : 'var(--loss)'}
                  stopOpacity={0.3}/>
                <stop offset="100%"
                  stopColor={up ? 'var(--profit)' : 'var(--loss)'}
                  stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v"
              stroke={up ? 'var(--profit)' : 'var(--loss)'}
              strokeWidth={1.5}
              fill={`url(#sg-${idx.symbol})`}
              dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* OHLC row */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3
                      border-t border-[var(--border-primary)]">
        {[
          { label: 'O', value: idx.open },
          { label: 'H', value: idx.high },
          { label: 'L', value: idx.low  },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[9px] text-[var(--text-tertiary)] uppercase
                          tracking-wider">{item.label}</p>
            <p className="text-xs font-mono text-[var(--text-primary)]">
              {item.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ─── Mover Row ──────────────────────────────── */
const MoverRow = ({ stock, rank, onClick }) => {
  const up = stock.pct >= 0;
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onClick}
      className="border-b border-[var(--border-primary)] cursor-pointer
                 hover:bg-[var(--bg-card-hover)] transition-colors duration-150"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[var(--accent-primary)]/10
                          flex items-center justify-center text-xs font-bold
                          text-[var(--accent-primary)]">
            {stock.symbol[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {stock.symbol}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[120px]">
              {stock.name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm
                     text-[var(--text-primary)]">
        {typeof stock.price === 'number'
          ? stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })
          : stock.price}
      </td>
      <td className="px-4 py-3 text-right">
        <p className={`text-sm font-mono font-semibold ${getPnLColor(stock.pct)}`}>
          {up ? '+' : ''}{(stock.pct || 0).toFixed(2)}%
        </p>
        <p className={`text-xs font-mono ${getPnLColor(stock.change)}`}>
          {up ? '+' : ''}{typeof stock.change === 'number'
            ? stock.change.toFixed(2) : stock.change}
        </p>
      </td>
      <td className="px-4 py-3 text-right text-xs font-mono
                     text-[var(--text-tertiary)]">
        {stock.vol}
      </td>
    </motion.tr>
  );
};

/* ─── Heatmap Cell ───────────────────────────── */
const HeatmapCell = ({ symbol, pct, sector, size = 1, onClick }) => {
  const getColor = (p) => {
    if (p >  3) return 'bg-green-600  text-white';
    if (p >  1) return 'bg-green-500/80 text-white';
    if (p >  0) return 'bg-green-400/60 text-white';
    if (p > -1) return 'bg-red-400/60 text-white';
    if (p > -3) return 'bg-red-500/80 text-white';
    return 'bg-red-700 text-white';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onClick={onClick}
      className={`rounded-lg flex flex-col items-center justify-center
                  cursor-pointer transition-all duration-200 select-none
                  ${getColor(pct)} ${size === 2
                    ? 'col-span-2 row-span-2 min-h-[80px]'
                    : 'min-h-[52px]'}`}
    >
      <p className="text-xs font-bold font-mono">{symbol}</p>
      <p className="text-[10px] font-mono opacity-90">
        {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
      </p>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════
   MAIN MARKETS PAGE
══════════════════════════════════════════════ */
const Markets = () => {
  const navigate             = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('indices');
  const [search, setSearch]  = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [globalSearching, setGlobalSearching] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState('');
  const globalSearchTimerRef = useRef(0);
  const [commoditiesList, setCommoditiesList] = useState([]);
  const [commoditiesLoading, setCommoditiesLoading] = useState(false);
  const ticks = useMarketStore((s) => s.ticks);
  const [indicesList, setIndicesList] = useState([]);
  const [gainersList, setGainersList] = useState([]);
  const [losersList, setLosersList] = useState([]);
  const [activeList, setActiveList] = useState([]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Markets] mounted');
    }
  }, []);


    useMarketSubscription({
    symbols: [
      'RELIANCE',
      'TCS',
      'HDFCBANK',
      'INFY',
      'SBIN',
      'WIPRO',
      'SUNPHARMA',
      'ICICIBANK',
      'TATAMOTORS',
      'ITC',
      'BHARTIARTL',
      'NESTLEIND',
      'JSWSTEEL',
      'AXISBANK',
      'HCLTECH',
    ],
    indices: (indicesList.length ? indicesList : INDICES).map((idx) => idx.name || idx.symbol),
  });


  const [liveData, setLiveData] = useState({});
  const marketArray = Object.values(liveData);

    const baseIndices = indicesList.length ? indicesList : INDICES;

    const mergedIndices = baseIndices.map((idx) => {
      const candidates = [
      liveData[idx.symbol],
      liveData[idx.symbol?.replaceAll('_', ' ')],
      liveData[idx.name?.toUpperCase()],
      liveData[idx.name],
    ];

    const live = candidates.find(Boolean);
    if (!live) return idx;

    return {
      ...idx,
      value: live.price ?? idx.value,
      change: live.change ?? idx.change,
      pct: live.changePercent ?? live.pct ?? idx.pct,
      open: live.open ?? idx.open,
      high: live.high ?? idx.high,
      low: live.low ?? idx.low,
    };
  });



  useEffect(() => {
    if (!ticks || ticks.length === 0) return;

    setLiveData((prev) => {
      const updated = { ...prev };

      ticks.forEach((tick) => {
        if (!tick?.symbol || typeof tick.price !== 'number') return;

        updated[tick.symbol] = {
          symbol: tick.symbol,
          price: tick.price,
          change: tick.change ?? 0,
          changePercent: tick.changePercent ?? 0,
          pct: tick.changePercent ?? 0,
          open: tick.open ?? 0,
          high: tick.high ?? 0,
          low: tick.low ?? 0,
          volume: tick.volume ?? 0,
          timestamp: tick.timestamp ?? Date.now(),
        };
      });

      return updated;
    });
  }, [ticks]);


  useEffect(() => {
    const loadMarketSnapshots = async () => {
      try {
        setLoading(true);

        const [indicesRes, gainersRes, losersRes, activeRes] = await Promise.all([
          tradingService.getMarketIndices(),
          tradingService.getTopGainers(10),
          tradingService.getTopLosers(10),
          tradingService.getMostActive(10),
        ]);

        const fetchedIndices = indicesRes?.data || [];
        const fetchedGainers = gainersRes?.data || [];
        const fetchedLosers = losersRes?.data || [];
        const fetchedActive = activeRes?.data || [];


        setIndicesList(
          fetchedIndices.map((idx) => ({
            symbol: (idx.symbol || idx.name || '').toUpperCase().replace(/\s+/g, '_'),
            name: idx.name || idx.symbol || '',
            value: idx.current_value ?? 0,
            change: idx.change ?? 0,
            pct: idx.change_percent ?? 0,
            open: idx.open ?? 0,
            high: idx.high ?? 0,
            low: idx.low ?? 0,
            vol: idx.volume ?? '—',
            exchange: idx.exchange || '',
          }))
        );
        
        setGainersList(
          fetchedGainers.map((item) => ({
            symbol: item.symbol,
            name: item.name || item.symbol,
            price: item.price ?? 0,
            change: item.change ?? 0,
            pct: item.change_percent ?? item.pct ?? 0,
            vol: item.volume ?? '—',
          }))
        );
        
        setLosersList(
          fetchedLosers.map((item) => ({
            symbol: item.symbol,
            name: item.name || item.symbol,
            price: item.price ?? 0,
            change: item.change ?? 0,
            pct: item.change_percent ?? item.pct ?? 0,
            vol: item.volume ?? '—',
          }))
        );
        
        setActiveList(
          fetchedActive.map((item) => ({
            symbol: item.symbol,
            name: item.name || item.symbol,
            price: item.price ?? 0,
            change: item.change ?? 0,
            pct: item.change_percent ?? item.pct ?? 0,
            vol: item.volume ?? '—',
          }))
        );


        if (fetchedIndices.length) {
          setLiveData((prev) => {
            const next = { ...prev };

            fetchedIndices.forEach((idx) => {
              const key = (idx.symbol || idx.name || '').toUpperCase();
              next[key] = {
                symbol: key,
                price: idx.current_value ?? 0,
                change: idx.change ?? 0,
                changePercent: idx.change_percent ?? 0,
                pct: idx.change_percent ?? 0,
                open: idx.open ?? 0,
                high: idx.high ?? 0,
                low: idx.low ?? 0,
                volume: idx.volume ?? 0,
              };
            });

            [...fetchedGainers, ...fetchedLosers, ...fetchedActive].forEach((item) => {
              const key = (item.symbol || '').toUpperCase();
              if (!key) return;

              next[key] = {
                symbol: key,
                price: item.price ?? 0,
                change: item.change ?? 0,
                changePercent: item.change_percent ?? item.pct ?? 0,
                pct: item.change_percent ?? item.pct ?? 0,
                volume: item.volume ?? 0,
              };
            });

            return next;
          });
        }
      } catch (error) {
        console.error('Markets snapshot load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarketSnapshots();
  }, []);

  const performGlobalSearch = async (query) => {
    const q = String(query || '').trim();
    if (import.meta.env.DEV) {
      console.log('[Markets] performGlobalSearch', { q });
    }
    if (q.length < 2) {
      setGlobalResults([]);
      setGlobalSearching(false);
      setGlobalSearchError('');
      return;
    }

    setGlobalSearching(true);
    setGlobalSearchError('');
    try {
      const res = await tradingService.searchStocks(q);
      const rows =
        res?.data?.data ||
        res?.data ||
        res?.data?.data?.data ||
        [];

      setGlobalResults(Array.isArray(rows) ? rows.slice(0, 15) : []);
    } catch (err) {
      console.error('Markets search error:', err);
      const msg = err?.message || 'Search failed';
      const code = err?.status ? `${err.status}: ` : '';
      setGlobalSearchError(`${code}${msg}`);
      setGlobalResults([]);
    } finally {
      setGlobalSearching(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const q = String(globalSearch || '').trim();

    if (q.length < 2) {
      setGlobalResults([]);
      setGlobalSearching(false);
      setGlobalSearchError('');
      return () => { alive = false; };
    }

    setGlobalSearching(true);
    setGlobalSearchError('');
    const id = window.setTimeout(async () => {
      try {
        if (!alive) return;
        await performGlobalSearch(q);
      } finally {
        if (!alive) return;
        setGlobalSearching(false);
      }
    }, 350);

    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [globalSearch]);


  const marketOpen = (() => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
    const mins = h * 60 + m;
    return mins >= 555 && mins <= 930; // 9:15 – 15:30
  })();

  /* heatmap data (NIFTY 50 sample) */
  const heatmapData = [
    { symbol:'RELIANCE', pct:0.97,  size:2 },
    { symbol:'TCS',      pct:-0.79, size:2 },
    { symbol:'HDFCBANK', pct:0.94,  size:2 },
    { symbol:'INFY',     pct:0.56 },
    { symbol:'ICICIBANK',pct:-0.40  },
    { symbol:'HINDUNILVR',pct:0.32 },
    { symbol:'ITC',      pct:0.84  },
    { symbol:'SBIN',     pct:0.85  },
    { symbol:'BHARTIARTL',pct:1.39 },
    { symbol:'KOTAKBANK',pct:-0.28 },
    { symbol:'LT',       pct:-1.26 },
    { symbol:'HCLTECH',  pct:0.63  },
    { symbol:'AXISBANK', pct:0.47  },
    { symbol:'ASIANPAINT',pct:-0.55},
    { symbol:'MARUTI',   pct:0.82  },
    { symbol:'SUNPHARMA',pct:1.37  },
    { symbol:'TITAN',    pct:0.48  },
    { symbol:'BAJFINANCE',pct:-0.92},
    { symbol:'DMART',    pct:0.35  },
    { symbol:'WIPRO',    pct:-0.65 },
    { symbol:'ONGC',     pct:1.12  },
    { symbol:'NTPC',     pct:0.74  },
    { symbol:'TATAMOTORS',pct:-1.67},
    { symbol:'JSWSTEEL', pct:-1.97 },
  ];

  const SECTIONS = [
    { key:'indices',  label:'Indices',      icon:BarChart3  },
    { key:'gainers',  label:'Top Gainers',  icon:TrendingUp  },
    { key:'losers',   label:'Top Losers',   icon:TrendingDown},
    { key:'active',   label:'Most Active',  icon:Flame       },
    { key:'commodities', label:'Commodities', icon:Globe },
    { key:'heatmap',  label:'Heat Map',     icon:Activity    },
  ];

  useEffect(() => {
    let mounted = true;

    const loadCommodities = async () => {
      try {
        setCommoditiesLoading(true);

        const settled = await Promise.allSettled(
          COMMODITIES_TOP.map(async (c) => {
            const res = await tradingService.getStockQuote(c.symbol);
            const payload = res?.data?.data || res?.data || null;
            const q = payload?.quote || payload?.data?.quote || payload?.quote || null;
            const price = Number(q?.price ?? payload?.price ?? 0);
            const prevClose = Number(q?.previous_close ?? payload?.previous_close ?? 0);
            const change = price - prevClose;
            const pct = prevClose ? (change / prevClose) * 100 : 0;

            return {
              symbol: c.symbol,
              name: c.name,
              price,
              change,
              pct,
              exchange: payload?.exchange || payload?.fullExchangeName || '',
            };
          })
        );

        const rows = settled
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
          .filter(Boolean);

        if (!mounted) return;
        setCommoditiesList(rows);
      } catch (e) {
        if (!mounted) return;
        setCommoditiesList([]);
      } finally {
        if (!mounted) return;
        setCommoditiesLoading(false);
      }
    };

    loadCommodities();
    const id = window.setInterval(loadCommodities, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const applyLiveToStock = (stock) => {
  const live =
    liveData[stock.symbol] ||
    liveData[stock.symbol?.toUpperCase()] ||
    null;

  if (!live) return stock;

  return {
    ...stock,
    price: live.price ?? stock.price,
    change: live.change ?? stock.change,
    pct: live.changePercent ?? live.pct ?? stock.pct,
    vol: live.volume ?? stock.vol,
  };
};

  
  
  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">
            Markets
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real-time NSE &amp; BSE market overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Global search (Equities + Indices + Commodities) */}
          <div className="relative">
            <Search size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={globalSearch}
              onChange={(e) => {
                const next = e.target.value;
                if (import.meta.env.DEV) {
                  console.log('[Markets] search input change', { next });
                }
                setGlobalSearch(next);

                // Hard guarantee: fire the request from here (debounced), not only via effect.
                window.clearTimeout(globalSearchTimerRef.current);

                const q = String(next || '').trim();
                if (q.length < 2) {
                  setGlobalResults([]);
                  setGlobalSearching(false);
                  setGlobalSearchError('');
                  return;
                }

                globalSearchTimerRef.current = window.setTimeout(() => {
                  performGlobalSearch(q);
                }, 350);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                performGlobalSearch(e.currentTarget.value);
              }}
              placeholder="Search stocks, indices, commodities..."
              className="pl-9 pr-3 py-2 rounded-lg text-sm
                         bg-[var(--bg-card)] border border-[var(--border-primary)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                         focus:outline-none focus:border-[var(--accent-primary)]
                         w-64"
            />

            {String(globalSearch || '').trim().length >= 2 && (
              <div className="absolute mt-2 w-full z-40
                              bg-[var(--bg-card)] border border-[var(--border-primary)]
                              rounded-lg overflow-hidden shadow-[var(--shadow-lg)]">
                {globalSearching && (
                  <div className="px-3 py-2 text-xs text-[var(--text-tertiary)]">
                    Searching...
                  </div>
                )}

                {!globalSearching && globalSearchError && (
                  <div className="px-3 py-2 text-xs text-[var(--loss)]">
                    {globalSearchError}
                  </div>
                )}

                {!globalSearching && !globalSearchError && globalResults.length === 0 && (
                  <div className="px-3 py-2 text-xs text-[var(--text-tertiary)]">
                    No results
                  </div>
                )}

                {globalResults.map((item) => (
                  <button
                    key={`${item.symbol}::${item.exchange || ''}`}
                    onClick={() => {
                      const sym = String(item.symbol || '').trim();
                      if (!sym) return;
                      setGlobalSearch('');
                      setGlobalResults([]);
                      navigate(`/stock/${encodeURIComponent(sym)}`);
                    }}
                    className="w-full text-left px-3 py-2
                               hover:bg-[var(--bg-tertiary)]
                               transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {item.symbol}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] truncate">
                          {item.name || ''}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                        {item.exchange || ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live / Closed badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
                           border text-xs font-semibold
                           ${marketOpen
                             ? 'bg-[var(--profit-bg)] border-[var(--profit-border)] text-[var(--profit)]'
                             : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-tertiary)]'}`}>
            <span className={`w-2 h-2 rounded-full
                              ${marketOpen ? 'bg-[var(--profit)] animate-pulse' : 'bg-[var(--text-tertiary)]'}`} />
            {marketOpen ? 'Market Open' : 'Market Closed'}
          </div>

          <button
            onClick={async () => {
              try {
                setLoading(true);
                const [indicesRes, gainersRes, losersRes, activeRes] = await Promise.all([
                  tradingService.getMarketIndices(),
                  tradingService.getTopGainers(10),
                  tradingService.getTopLosers(10),
                  tradingService.getMostActive(10),
                ]);

                const allRows = [
                  ...(indicesRes?.data || []),
                  ...(gainersRes?.data || []),
                  ...(losersRes?.data || []),
                  ...(activeRes?.data || []),
                ];

                setLiveData((prev) => {
                  const next = { ...prev };

                  allRows.forEach((item) => {
                    const key = (item.symbol || item.name || '').toUpperCase();
                    if (!key) return;

                    next[key] = {
                      symbol: key,
                      price: item.current_value ?? item.price ?? 0,
                      change: item.change ?? 0,
                      changePercent: item.change_percent ?? item.pct ?? 0,
                      pct: item.change_percent ?? item.pct ?? 0,
                      open: item.open ?? 0,
                      high: item.high ?? 0,
                      low: item.low ?? 0,
                      volume: item.volume ?? 0,
                    };
                  });

                  return next;
                });
              } catch (error) {
                console.error('Markets refresh error:', error);
              } finally {
                setLoading(false);
              }
            }}
            className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]
                       text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       hover:border-[var(--border-secondary)] transition-all duration-200"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Section Tabs ─────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none
                      bg-[var(--bg-card)] border border-[var(--border-primary)]
                      rounded-md p-1.5" style={{marginBottom: '0.5rem'}}>
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md
                         text-sm font-medium whitespace-nowrap transition-all duration-200
                         ${activeSection === sec.key
                           ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(0,82,255,0.3)]'
                           : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <sec.icon size={16}/>
            {sec.label}
          </button>
        ))}
      </div>

      {/* ── Indices Grid ─────────────────────── */}
      {activeSection === 'indices' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                        xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl"/>
              ))
            : mergedIndices.map((idx) => (
                <IndexCard
                key={idx.symbol}
                idx={{
                  ...idx,
                  value: idx.value ?? idx.price ?? 0,
                  change: idx.change ?? 0,
                  pct: idx.pct ?? 0,
                }}
                onClick={() => navigate(`/stock/${idx.symbol}`)}
              />
              ))
          }
        </div>
      )}

      {activeSection === 'commodities' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                        rounded-lg overflow-hidden" style={{padding: '0.25rem'}}>
          <div className="flex items-center gap-3 px-5 py-4
                          border-b border-[var(--border-primary)]">
            <h2 className="text-sm font-heading font-semibold
                           text-[var(--text-primary)] flex items-center gap-2">
              <Globe size={18} className="text-[var(--accent-primary)]" />
              Top Commodities
            </h2>
            <div className="ml-auto text-[10px] text-[var(--text-tertiary)]">
              Search for more above
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                  {['Instrument','LTP','Change'].map((h) => (
                    <th key={h}
                        className={`px-4 py-3 text-[10px] font-bold uppercase
                                   tracking-[0.08em] text-[var(--text-tertiary)]
                                   ${h !== 'Instrument' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(commoditiesLoading ? [] : commoditiesList).map((row) => {
                  const up = (row.pct ?? 0) >= 0;
                  return (
                    <tr
                      key={row.symbol}
                      onClick={() => navigate(`/stock/${encodeURIComponent(row.symbol)}`)}
                      className="border-b border-[var(--border-primary)] cursor-pointer
                                 hover:bg-[var(--bg-card-hover)] transition-colors duration-150"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-[var(--text-primary)]">
                            {row.symbol}
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)] truncate max-w-[260px]">
                            {row.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-primary)]">
                        {Number(row.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`text-sm font-mono font-semibold ${getPnLColor(row.pct || 0)}`}>
                          {up ? '+' : ''}{(row.pct || 0).toFixed(2)}%
                        </div>
                        <div className={`text-xs font-mono ${getPnLColor(row.change || 0)}`}>
                          {row.change >= 0 ? '+' : ''}{(row.change || 0).toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {commoditiesLoading && (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border-primary)]">
                      <td className="px-4 py-3" colSpan={3}>
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                )}

                {!commoditiesLoading && commoditiesList.length === 0 && (
                  <tr className="border-b border-[var(--border-primary)]">
                    <td className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]" colSpan={3}>
                      No commodity data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Gainers / Losers / Active tables ─── */}
      {['gainers','losers','active'].includes(activeSection) && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                        rounded-lg overflow-hidden" style={{padding: '0.25rem'}}>
          {/* Search bar */}
          <div className="flex items-center gap-3 px-5 py-4
                          border-b border-[var(--border-primary)]">
            <h2 className="text-sm font-heading font-semibold
                           text-[var(--text-primary)] flex items-center gap-2">
              {activeSection === 'gainers' && <><TrendingUp  size={18} className="text-[var(--profit)]"/> Top Gainers</>}
              {activeSection === 'losers'  && <><TrendingDown size={18} className="text-[var(--loss)]" /> Top Losers</>}
              {activeSection === 'active'  && <><Flame       size={18} className="text-amber-400"     /> Most Active</>}
            </h2>
            <div className="ml-auto relative">
              <Search size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2
                           text-[var(--text-tertiary)]"/>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs
                           bg-[var(--bg-input)] border border-[var(--border-primary)]
                           text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                           focus:outline-none focus:border-[var(--accent-primary)] w-36"
                style={{marginLeft: '0', width:'100%', paddingLeft: '2rem', paddingRight: '2rem'}}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]
                               border-b border-[var(--border-primary)]">
                  {['Stock','LTP','Change','Volume'].map((h) => (
                    <th key={h}
                        className={`px-4 py-3 text-[10px] font-bold uppercase
                                   tracking-[0.08em] text-[var(--text-tertiary)]
                                   ${h !== 'Stock' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}
                          className="border-b border-[var(--border-primary)]">
                        {[...Array(4)].map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-20"/>
                          </td>
                        ))}
                      </tr>
                    ))
                  : (() => {
                   let sorted =
                    activeSection === 'gainers'
                      ? [...(gainersList.length ? gainersList : GAINERS)]
                      : activeSection === 'losers'
                        ? [...(losersList.length ? losersList : LOSERS)]
                        : [...(activeList.length ? activeList : ACTIVE)];

                
                  if (activeSection === 'gainers') {
                    sorted.sort((a, b) => b.pct - a.pct);
                  } else if (activeSection === 'losers') {
                    sorted.sort((a, b) => a.pct - b.pct);
                  } else {
                    sorted.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
                  }


                  
                  
                  return sorted
                    .filter((s) =>
                      search
                        ? s.symbol.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .slice(0, 10)
                    .map((s, i) => (
                      <MoverRow
                        key={s.symbol}
                        stock={applyLiveToStock(s)}
                        rank={i}
                        onClick={() => navigate(`/stock/${s.symbol}`)}
                      />
                    ));
                })()
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Heat Map ─────────────────────────── */}
      {activeSection === 'heatmap' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)]
                        rounded-md p-5" style={{padding: '0.25rem'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-heading font-semibold
                             text-[var(--text-primary)]">
                NIFTY 50 Heat Map
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Colour intensity = magnitude of price change
              </p>
            </div>
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-1 text-[10px]
                            text-[var(--text-tertiary)]">
              <div className="flex gap-0.5">
                {['bg-red-700','bg-red-500/70','bg-red-400/50',
                  'bg-green-400/50','bg-green-500/70','bg-green-600'].map((c) => (
                  <div key={c} className={`w-6 h-4 rounded-sm ${c}`}/>
                ))}
              </div>
              <span className="ml-1">Low → High</span>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl"/>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10
                            gap-1.5 auto-rows-[52px]">
              {heatmapData.map((cell) => (
                <HeatmapCell
                  key={cell.symbol}
                  symbol={cell.symbol}
                  pct={cell.pct}
                  size={cell.size || 1}
                  onClick={() => navigate(`/stock/${cell.symbol}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Markets;