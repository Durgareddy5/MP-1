// import { formatPrice } from '@/utils/formatters';

// export default function PredictionTable({ data = [] }) {
//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full">
//         <thead>
//           <tr className="text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
//             <th className="px-3 py-2 text-left">Stock</th>
//             <th className="px-3 py-2 text-right">Predicted</th>
//             <th className="px-3 py-2 text-right">LTP</th>
//             <th className="px-3 py-2 text-right">Action</th>
//           </tr>
//         </thead>

//         <tbody>
//           {data.map((stock) => {
//             const action = (stock.action || 'HOLD').toUpperCase();
//             const actionClass =
//               action === 'BUY'
//                 ? 'bg-[var(--profit-bg)] text-[var(--profit)]'
//                 : action === 'SELL'
//                 ? 'bg-[var(--loss-bg)] text-[var(--loss)]'
//                 : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';

//             return (
//               <tr
//                 key={stock.symbol}
//                 className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
//               >
//                 <td className="px-2 py-2">
//                   <div className="flex items-center gap-1">
//                     <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent-primary)]">
//                       {stock.symbol?.[0] || '?'}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold text-[var(--text-primary)]">{stock.symbol}</p>
//                       <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[100px]">{stock._source === 'index' ? 'Market Index' : (stock.name || '')}</p>
//                     </div>
//                   </div>
//                 </td>

//                 <td className="px-2 py-2 text-right font-mono text-sm text-[var(--text-primary)]">
//                   {stock.predicted_price != null ? formatPrice(stock.predicted_price) : '—'}
//                 </td>

//                 <td className="px-2 py-2 text-right font-mono text-sm text-[var(--text-primary)]">
//                   {stock.last_price != null ? formatPrice(stock.last_price) : '—'}
//                 </td>

//                 <td className="px-2 py-2 text-right">
//                   <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${actionClass}`}>
//                     {action}
//                   </span>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

import { formatPrice } from '@/utils/formatters';

export default function PredictionTable({ data = [], horizon = '1d' }) {
  const priceField = horizon === '5d' ? 'predicted_price_5d' : 'predicted_price';
  const returnField = horizon === '5d' ? 'predicted_return_5d' : 'predicted_return_1d';
  const columnLabel = horizon === '5d' ? 'Predicted (5D)' : 'Predicted (1D)';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
            <th className="px-3 py-2 text-left">Stock</th>
            <th className="px-3 py-2 text-right">{columnLabel}</th>
            <th className="px-3 py-2 text-right">LTP</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((stock) => {
            const action = (stock.action || 'HOLD').toUpperCase();
            const actionClass =
              action === 'BUY'
                ? 'bg-[var(--profit-bg)] text-[var(--profit)]'
                : action === 'SELL'
                ? 'bg-[var(--loss-bg)] text-[var(--loss)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';

            const predictedPrice = stock[priceField];
            const predictedReturn = stock[returnField];
            const returnClass =
              predictedReturn > 0
                ? 'text-[var(--profit)]'
                : predictedReturn < 0
                ? 'text-[var(--loss)]'
                : 'text-[var(--text-tertiary)]';

            return (
              <tr
                key={stock.symbol}
                className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent-primary)]">
                      {stock.symbol?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{stock.symbol}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[100px]">{stock._source === 'index' ? 'Market Index' : (stock.name || '')}</p>
                    </div>
                  </div>
                </td>

                <td className="px-2 py-2 text-right">
                  <p className="font-mono text-sm text-[var(--text-primary)]">
                    {predictedPrice != null ? formatPrice(predictedPrice) : '—'}
                  </p>
                  {predictedReturn != null && (
                    <p className={`text-xs font-mono ${returnClass}`}>
                      {predictedReturn > 0 ? '+' : ''}{(predictedReturn * 100).toFixed(2)}%
                    </p>
                  )}
                </td>

                <td className="px-2 py-2 text-right font-mono text-sm text-[var(--text-primary)]">
                  {stock.last_price != null ? formatPrice(stock.last_price) : '—'}
                </td>

                <td className="px-2 py-2 text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${actionClass}`}>
                    {action}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
