import { MovingAverageResult, MarketSignal } from '../../common/types/market.types';

/**
 * Computes simple moving averages and generates BUY/HOLD/WAIT signal.
 *
 * BUY  = current (short-term) prices are meaningfully below the long-term average
 *        → the market is cheap relative to history; good time to buy.
 * WAIT = current prices are meaningfully above the long-term average
 *        → prices are rising; wait for a correction.
 * HOLD = prices are within 2 % of long-term average, or insufficient history.
 *
 * Requires at least longWindow / 2 data points for a meaningful signal.
 */
export function computeMovingAverage(
  prices: Array<{ date: Date; price: number }>,
  shortWindow = 10,
  longWindow = 50,
): MovingAverageResult {
  const sorted = [...prices].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const values = sorted.map((p) => p.price);

  // Not enough history to produce a reliable signal
  if (values.length < longWindow / 2) {
    return { shortTermMA: 0, longTermMA: 0, signal: 'HOLD' };
  }

  const shortTermMA = simpleMA(values, shortWindow);
  const longTermMA = simpleMA(values, longWindow);

  let signal: MarketSignal;
  if (shortTermMA < longTermMA * 0.98) {
    signal = 'BUY'; // Current prices below long-term avg = market is cheap relative to history
  } else if (shortTermMA > longTermMA * 1.02) {
    signal = 'WAIT'; // Current prices above long-term avg = prices rising
  } else {
    signal = 'HOLD';
  }

  return { shortTermMA, longTermMA, signal };
}

function simpleMA(values: number[], window: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
}
