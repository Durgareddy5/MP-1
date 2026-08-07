const calculateOrderValue = (quantity, price, priceType = 'MARKET') => {
  return quantity * price;
};

const calculateGainLoss = (currentValue, investedValue) => {
  return currentValue - investedValue;
};

const calculateGainLossPercentage = (currentValue, investedValue) => {
  if (investedValue === 0) return 0;
  return ((currentValue - investedValue) / investedValue) * 100;
};

const calculateAverageBuyPrice = (holdings) => {
  if (holdings.length === 0) return 0;
  const totalCost = holdings.reduce((sum, h) => sum + (h.quantity * h.price), 0);
  const totalQuantity = holdings.reduce((sum, h) => sum + h.quantity, 0);
  return totalQuantity === 0 ? 0 : totalCost / totalQuantity;
};

const calculatePortfolioMetrics = (holdings, currentPrices) => {
  let totalInvested = 0;
  let totalCurrentValue = 0;

  holdings.forEach((holding) => {
    const invested = holding.quantity * holding.averageBuyPrice;
    const current = holding.quantity * (currentPrices[holding.symbol] || holding.averageBuyPrice);
    totalInvested += invested;
    totalCurrentValue += current;
  });

  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnsPercentage = totalInvested === 0 ? 0 : (totalReturns / totalInvested) * 100;

  return {
    totalInvested,
    totalCurrentValue,
    totalReturns,
    totalReturnsPercentage,
  };
};

const calculateMarginRequired = (quantity, price, marginRatio = 0.20) => {
  return quantity * price * marginRatio;
};

const isOrderExecutable = (orderType, price, currentPrice, margin = 0) => {
  if (orderType === 'BUY') {
    return true;
  }
  if (orderType === 'SELL') {
    return true;
  }
  return false;
};

const calculateVWAP = (ohlcData) => {
  if (ohlcData.length === 0) return 0;
  let totalVolume = 0;
  let totalTP = 0;

  ohlcData.forEach((candle) => {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    totalTP += typicalPrice * candle.volume;
    totalVolume += candle.volume;
  });

  return totalVolume === 0 ? 0 : totalTP / totalVolume;
};

const calculateRSI = (prices, periods = 14) => {
  if (prices.length < periods + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= periods; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / periods;
  const averageLoss = losses / periods;

  if (averageLoss === 0) return 100;
  const rs = averageGain / averageLoss;
  return 100 - (100 / (1 + rs));
};

export {
  calculateOrderValue,
  calculateGainLoss,
  calculateGainLossPercentage,
  calculateAverageBuyPrice,
  calculatePortfolioMetrics,
  calculateMarginRequired,
  isOrderExecutable,
  calculateVWAP,
  calculateRSI,
};
