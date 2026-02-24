export interface ScatterPoint {
  vin: string;
  price: number;
  mileage: number;
  year: number;
  trim: string | null;
  dealScore: number;
  daysOnMarket: number | null;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

export interface ScatterResponse {
  points: ScatterPoint[];
  regression: RegressionResult;
  stats: {
    avgPrice: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
    stdDev: number;
    count: number;
  };
}
