// ═══════════════════════════════════════════════════════
// Indian Market Formatters
// ═══════════════════════════════════════════════════════

/**
 * Format number as Indian Rupees (₹)
 */
export const formatINR = (amount, options = {}) => {
  const { compact = false, decimals = 2 } = options;

  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';

  if (compact) {
    const absAmount = Math.abs(amount);
    if (absAmount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (absAmount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    if (absAmount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)} K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Format number in Indian notation (with commas)
 */
export const formatIndianNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(decimals)}%`;
};

/**
 * Format stock price
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '0.00';
  return Number(price).toFixed(2);
};

/**
 * Format volume (K, L, Cr)
 */
export const formatVolume = (volume) => {
  if (!volume) return '0';
  if (volume >= 10000000) return `${(volume / 10000000).toFixed(2)} Cr`;
  if (volume >= 100000) return `${(volume / 100000).toFixed(2)} L`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)} K`;
  return volume.toString();
};

/**
 * Format market cap
 */
export const formatMarketCap = (cap) => {
  if (!cap) return 'N/A';
  if (cap >= 1000000000000) return `₹${(cap / 1000000000000).toFixed(2)} T`;
  if (cap >= 10000000) return `₹${(cap / 10000000).toFixed(2)} Cr`;
  if (cap >= 100000) return `₹${(cap / 100000).toFixed(2)} L`;
  return formatINR(cap);
};

/**
 * Format date to IST
 */
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  const options = {
    timeZone: 'Asia/Kolkata',
  };

  switch (format) {
    case 'full':
      return d.toLocaleDateString('en-IN', {
        ...options,
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    case 'datetime':
      return d.toLocaleString('en-IN', {
        ...options,
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    case 'time':
      return d.toLocaleTimeString('en-IN', {
        ...options,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    case 'relative': {
      const now = new Date();
      const diff = now - d;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString('en-IN', { ...options, month: 'short', day: 'numeric' });
    }
    default: // 'short'
      return d.toLocaleDateString('en-IN', {
        ...options,
        year: 'numeric', month: 'short', day: 'numeric',
      });
  }
};

/**
 * Get color class based on profit/loss
 */
export const getPnLColor = (value) => {
  if (value > 0) return 'text-[var(--profit)]';
  if (value < 0) return 'text-[var(--loss)]';
  return 'text-[var(--text-secondary)]';
};

/**
 * Get background class based on profit/loss
 */
export const getPnLBgColor = (value) => {
  if (value > 0) return 'badge-profit';
  if (value < 0) return 'badge-loss';
  return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
};