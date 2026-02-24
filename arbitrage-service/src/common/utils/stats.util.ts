import { MarketDataStatsResponse } from '../../market-data/dto/market-data-response.dto';

/**
 * Computes descriptive statistics from an already-fetched array of prices.
 * Use this only when the data is already in memory (e.g., charts scatter set).
 * For large datasets, prefer a SQL aggregate query instead.
 */
export function computeStatsFromValues(
  prices: number[],
): MarketDataStatsResponse {
  if (prices.length === 0) {
    return { avgPrice: 0, medianPrice: 0, minPrice: 0, maxPrice: 0, stdDev: 0, count: 0 };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  const stdDev = Math.sqrt(
    prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length,
  );

  return {
    avgPrice: Math.round(mean),
    medianPrice: median,
    minPrice: sorted[0],
    maxPrice: sorted[sorted.length - 1],
    stdDev: Math.round(stdDev),
    count: prices.length,
  };
}
