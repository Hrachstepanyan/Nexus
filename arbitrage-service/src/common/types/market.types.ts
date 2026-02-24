export interface MarketStats {
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  stdDev: number;
  count: number;
}

export interface DealScore {
  score: number; // -100 to 100
  label: 'Great Deal' | 'Good Deal' | 'Fair' | 'Overpriced' | 'Bad Deal';
  expectedPrice: number;
  actualPrice: number;
  savings: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

export type MarketSignal = 'BUY' | 'HOLD' | 'WAIT';

export interface MovingAverageResult {
  shortTermMA: number;
  longTermMA: number;
  signal: MarketSignal;
}
