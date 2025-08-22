// Currency conversion utilities
// Fixed exchange rate: 1 EUR = 1.95583 BGN

export const EXCHANGE_RATE = 1.95583; // 1 EUR = 1.95583 BGN

export interface Price {
  amount: number;
  currency: 'BGN' | 'EUR';
}

export interface DualPrice {
  bgn: number;
  eur: number;
}

/**
 * Convert BGN to EUR
 */
export function bgnToEur(bgn: number): number {
  return Math.round((bgn / EXCHANGE_RATE) * 100) / 100;
}

/**
 * Convert EUR to BGN
 */
export function eurToBgn(eur: number): number {
  return Math.round(eur * EXCHANGE_RATE * 100) / 100;
}

/**
 * Get dual price (both BGN and EUR) from a single price
 */
export function getDualPrice(price: Price): DualPrice {
  if (price.currency === 'BGN') {
    return {
      bgn: price.amount,
      eur: bgnToEur(price.amount)
    };
  } else {
    return {
      bgn: eurToBgn(price.amount),
      eur: price.amount
    };
  }
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: 'BGN' | 'EUR'): string {
  const symbol = currency === 'BGN' ? 'лв.' : '€';
  return `${amount.toFixed(2)} ${symbol}`;
}

/**
 * Format dual price display
 */
export function formatDualPrice(dualPrice: DualPrice): string {
  return `${formatPrice(dualPrice.bgn, 'BGN')} / ${formatPrice(dualPrice.eur, 'EUR')}`;
}

/**
 * Validate if a price is reasonable (not too high or too low)
 */
export function validatePrice(amount: number, currency: 'BGN' | 'EUR'): boolean {
  const minBgn = 1; // Minimum 1 BGN
  const maxBgn = 10000; // Maximum 10,000 BGN
  
  if (currency === 'BGN') {
    return amount >= minBgn && amount <= maxBgn;
  } else {
    const bgnAmount = eurToBgn(amount);
    return bgnAmount >= minBgn && bgnAmount <= maxBgn;
  }
}
