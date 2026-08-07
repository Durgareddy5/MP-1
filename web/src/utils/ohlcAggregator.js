// ============================================
// OHLC Aggregator (Production-grade)
// ============================================

export class OHLCAggregator {
  constructor(intervalMs = 60000) {
    this.intervalMs = intervalMs; // 1 min default
    this.currentCandle = null;
    this.lastClose = null;
  }

  // 🔥 Get bucket timestamp (start of candle)
  getBucketTime(timestamp) {
    return Math.floor(timestamp / this.intervalMs) * this.intervalMs;
  }

  // 🔥 Process incoming tick
  processTick(tick) {
    const { price, timestamp } = tick;

    const bucketTime = this.getBucketTime(timestamp);

    // ✅ FIRST CANDLE
    if (!this.currentCandle) {
      this.currentCandle = this.createNewCandle(bucketTime, price);
      return { type: 'new', candle: this.currentCandle };
    }

    // ✅ NEW TIMEFRAME → CLOSE OLD CANDLE
    if (bucketTime !== this.currentCandle.time) {
      const closedCandle = { ...this.currentCandle };

      this.lastClose = closedCandle.close;

      // 🧠 HANDLE GAP (no ticks case)
      if (bucketTime - this.currentCandle.time > this.intervalMs) {
        this.currentCandle = this.createGapCandle(bucketTime);
      } else {
        this.currentCandle = this.createNewCandle(bucketTime, price);
      }

      return {
        type: 'close',
        closed: closedCandle,
        new: this.currentCandle,
      };
    }

    // ✅ UPDATE CURRENT CANDLE
    this.currentCandle.high = Math.max(this.currentCandle.high, price);
    this.currentCandle.low = Math.min(this.currentCandle.low, price);
    this.currentCandle.close = price;

    return { type: 'update', candle: this.currentCandle };
  }

  // 🔥 Create new candle
  createNewCandle(time, price) {
    return {
      time,
      open: price,
      high: price,
      low: price,
      close: price,
    };
  }

  // 🔥 Handle NO TICKS (carry forward)
  createGapCandle(time) {
    const price = this.lastClose || 0;

    return {
      time,
      open: price,
      high: price,
      low: price,
      close: price,
    };
  }
}