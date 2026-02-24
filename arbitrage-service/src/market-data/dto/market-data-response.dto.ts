export interface MarketDataListingResponse {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  trimNormalized: string | null;
  price: number;
  mileage: number;
  city: string | null;
  state: string | null;
  condition: string | null;
  titleStatus: string | null;
  source: string;
  sourceUrl: string | null;
  daysOnMarket: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketDataStatsResponse {
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  stdDev: number;
  count: number;
}

export interface MarketDataResponse {
  listings: MarketDataListingResponse[];
  stats: MarketDataStatsResponse;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
