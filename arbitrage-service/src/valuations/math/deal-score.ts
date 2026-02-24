import { DealScore } from '../../common/types/market.types';

/**
 * Calculates a deal score from -100 (terrible) to 100 (amazing).
 * score = clamp((expected - actual) / stdDev * 33, -100, 100)
 */
export function calculateDealScore(
  actualPrice: number,
  expectedPrice: number,
  stdDev: number,
): DealScore {
  if (stdDev === 0) {
    return {
      score: 0,
      label: 'Fair',
      expectedPrice,
      actualPrice,
      savings: expectedPrice - actualPrice,
    };
  }

  const raw = ((expectedPrice - actualPrice) / stdDev) * 33;
  const score = Math.round(Math.max(-100, Math.min(100, raw)));
  const savings = expectedPrice - actualPrice;

  let label: DealScore['label'];
  if (score >= 50) label = 'Great Deal';
  else if (score >= 20) label = 'Good Deal';
  else if (score >= -20) label = 'Fair';
  else if (score >= -50) label = 'Overpriced';
  else label = 'Bad Deal';

  return { score, label, expectedPrice, actualPrice, savings };
}
