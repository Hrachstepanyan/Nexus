import { RegressionResult, MarketStats } from '../../common/types/market.types';

export interface ScatterPoint {
  vin: string;
  price: number;
  mileage: number;
  year: number;
  trim: string | null;
  dealScore: number;
  daysOnMarket: number | null;
}

export interface ScatterResponse {
  points: ScatterPoint[];
  regression: RegressionResult;
  stats: MarketStats;
}
