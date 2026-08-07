import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

let activeSymbols = new Set();

export const addSymbols = (symbols = []) => {
  activeSymbols = new Set(symbols);
};

export const startYahooStream = (emitTick) => {
  setInterval(async () => {
    try {
      if (activeSymbols.size === 0) return;

      const symbolsArray = Array.from(activeSymbols);

      let quotes = await yahooFinance.quote(symbolsArray);

      if (!Array.isArray(quotes)) {
        quotes = [quotes];
      }

      quotes.forEach((q) => {
        if (!q || !q.symbol) return;

        emitTick({
          symbol: q.symbol,
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          time: Date.now(),
        });
      });

    } catch (err) {
      console.error('Yahoo Error:', err.message);
    }
  }, 1000);
};