// import { useEffect, useState } from "react";
// import { motion } from 'framer-motion';
// import { getMLPredictions } from "../services/mlService";
// import PredictionTable from "../components/ML/PredictionTable";
// import tradingService from "@/services/tradingService";

// export default function MLPrediction() {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const indexAliasToYahoo = {
//     'NIFTY 50': '^NSEI',
//     'NIFTY BANK': '^NSEBANK',
//     'S&P BSE SENSEX': '^BSESN',
//     'SENSEX': '^BSESN',
//     'INDIA VIX': '^INDIAVIX',
//     'NIFTY 100': '^CNX100',
//     'NIFTY 500': '^CRSLDX',
//     'NIFTY IT': '^CNXIT',
//     'NIFTY PHARMA': '^CNXPHARMA',
//     'NIFTY AUTO': '^CNXAUTO',
//     'NIFTY FMCG': '^CNXFMCG',
//     'NIFTY METAL': '^CNXMETAL',
//     'NIFTY REALTY': '^CNXREALTY',
//     'NIFTY ENERGY': '^CNXENERGY',
//     'NIFTY INFRA': '^CNXINFRA',
//     'NIFTY PSU BANK': '^CNXPSUBANK',
//     'NIFTY MIDCAP 50': '^NSEMDCP50',
//     'NIFTY NEXT 50': '^NSMIDCP',
//     'NIFTY SMLCAP 100': '^CNXSC',
//     'NIFTY SMALLCAP 100': '^CNXSC',
//   };

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [predRes, indicesRes] = await Promise.all([
//         getMLPredictions(),
//         tradingService.getMarketIndices(),
//       ]);

//       const predictions = Array.isArray(predRes) ? predRes : [];
//       const indices = Array.isArray(indicesRes?.data) ? indicesRes.data : [];

//       const indexKeys = new Set(
//         indices
//           .map((idx) => String(idx?.symbol || idx?.name || '').trim())
//           .filter(Boolean)
//           .map((s) => s.toUpperCase())
//       );

//       const bySymbol = new Map(
//         predictions
//           .filter((x) => x?.symbol)
//           .map((x) => [String(x.symbol).toUpperCase(), x])
//       );

//       // Merge indices: if ML returned prediction under Yahoo index symbol (e.g. ^NSEI)
//       // attach it to the market display symbol row (e.g. NIFTY 50).
//       for (const idx of indices) {
//         const sym = String(idx?.symbol || idx?.name || '').trim();
//         if (!sym) continue;
//         const key = sym.toUpperCase();

//         const yahooKey = String(indexAliasToYahoo[key] || '').toUpperCase();
//         const predicted = (yahooKey && bySymbol.has(yahooKey)) ? bySymbol.get(yahooKey) : null;

//         if (predicted && !bySymbol.has(key)) {
//           bySymbol.set(key, {
//             ...predicted,
//             symbol: sym,
//             last_price: Number(idx?.current_value || predicted?.last_price || 0),
//           });
//           continue;
//         }

//         if (bySymbol.has(key)) {
//           const existing = bySymbol.get(key);
//           bySymbol.set(key, {
//             ...existing,
//             symbol: sym,
//             last_price: Number(idx?.current_value || existing?.last_price || 0),
//           });
//           continue;
//         }

//         bySymbol.set(key, {
//           symbol: sym,
//           predicted_price: null,
//           last_price: Number(idx?.current_value || 0),
//           action: 'HOLD',
//           _source: 'index',
//         });
//       }

//       setData(Array.from(bySymbol.values()));
//     } catch (_) {
//       setData([]);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   return (
//     <div className="space-y-6">
//       <div className="flex items-start justify-between">
//         <div>
//           <motion.h1
//             initial={{ opacity: 0, y: -6 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-2xl font-heading font-bold text-[var(--text-primary)]"
//           >
//             🤖 AI Stock Predictions
//           </motion.h1>
//           <p className="text-sm text-[var(--text-secondary)] mt-1">Model-backed market predictions and index view</p>
//         </div>

//         <motion.button
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           onClick={fetchData}
//           disabled={loading}
//           className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-all duration-200"
//         >
//           Refresh
//         </motion.button>
//       </div>

//       <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
//         <div style={{ padding: '0.25rem' }}>
//           {loading ? (
//             <p className="text-sm text-[var(--text-secondary)]">Loading predictions...</p>
//           ) : (
//             <PredictionTable data={data} />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { getMLPredictions } from "../services/mlService";
import PredictionTable from "../components/ML/PredictionTable";
import tradingService from "@/services/tradingService";

export default function MLPrediction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState('1d');

  const indexAliasToYahoo = {
    'NIFTY 50': '^NSEI',
    'NIFTY BANK': '^NSEBANK',
    'S&P BSE SENSEX': '^BSESN',
    'SENSEX': '^BSESN',
    'INDIA VIX': '^INDIAVIX',
    'NIFTY 100': '^CNX100',
    'NIFTY 500': '^CRSLDX',
    'NIFTY IT': '^CNXIT',
    'NIFTY PHARMA': '^CNXPHARMA',
    'NIFTY AUTO': '^CNXAUTO',
    'NIFTY FMCG': '^CNXFMCG',
    'NIFTY METAL': '^CNXMETAL',
    'NIFTY REALTY': '^CNXREALTY',
    'NIFTY ENERGY': '^CNXENERGY',
    'NIFTY INFRA': '^CNXINFRA',
    'NIFTY PSU BANK': '^CNXPSUBANK',
    'NIFTY MIDCAP 50': '^NSEMDCP50',
    'NIFTY NEXT 50': '^NSMIDCP',
    'NIFTY SMLCAP 100': '^CNXSC',
    'NIFTY SMALLCAP 100': '^CNXSC',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [predRes, indicesRes] = await Promise.all([
        getMLPredictions(),
        tradingService.getMarketIndices(),
      ]);

      const predictions = Array.isArray(predRes) ? predRes : [];
      const indices = Array.isArray(indicesRes?.data) ? indicesRes.data : [];

      const indexKeys = new Set(
        indices
          .map((idx) => String(idx?.symbol || idx?.name || '').trim())
          .filter(Boolean)
          .map((s) => s.toUpperCase())
      );

      const bySymbol = new Map(
        predictions
          .filter((x) => x?.symbol)
          .map((x) => [String(x.symbol).toUpperCase(), x])
      );

      // Merge indices: if ML returned prediction under Yahoo index symbol (e.g. ^NSEI)
      // attach it to the market display symbol row (e.g. NIFTY 50).
      for (const idx of indices) {
        const sym = String(idx?.symbol || idx?.name || '').trim();
        if (!sym) continue;
        const key = sym.toUpperCase();

        const yahooKey = String(indexAliasToYahoo[key] || '').toUpperCase();
        const predicted = (yahooKey && bySymbol.has(yahooKey)) ? bySymbol.get(yahooKey) : null;

        if (predicted && !bySymbol.has(key)) {
          bySymbol.set(key, {
            ...predicted,
            symbol: sym,
            last_price: Number(idx?.current_value || predicted?.last_price || 0),
          });
          continue;
        }

        if (bySymbol.has(key)) {
          const existing = bySymbol.get(key);
          bySymbol.set(key, {
            ...existing,
            symbol: sym,
            last_price: Number(idx?.current_value || existing?.last_price || 0),
          });
          continue;
        }

        bySymbol.set(key, {
          symbol: sym,
          predicted_price: null,
          predicted_price_5d: null,
          last_price: Number(idx?.current_value || 0),
          action: 'HOLD',
          _source: 'index',
        });
      }

      setData(Array.from(bySymbol.values()));
    } catch (_) {
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-heading font-bold text-[var(--text-primary)]"
          >
            🤖 AI Stock Predictions
          </motion.h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Model-backed market predictions and index view</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-1">
            {[
              { key: '1d', label: '1 Day' },
              { key: '5d', label: '5 Day' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setHorizon(opt.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  horizon === opt.key
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-all duration-200"
          >
            Refresh
          </motion.button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md p-4">
        <div style={{ padding: '0.25rem' }}>
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading predictions...</p>
          ) : (
            <PredictionTable data={data} horizon={horizon} />
          )}
        </div>
      </div>
    </div>
  );
}