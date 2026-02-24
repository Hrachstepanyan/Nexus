export interface RawScrapedListing {
  vin?: string;
  make?: string;
  model?: string;
  year?: number | string;
  trim?: string;
  price?: string;
  mileage?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  condition?: string;
  titleStatus?: string;
  source: string;
  sourceUrl?: string;
  daysOnMarket?: number | string;
}

export interface ParsedListing {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  price: number; // cents
  mileage: number;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  condition: string | null;
  titleStatus: string | null;
  source: string;
  sourceUrl: string | null;
  daysOnMarket: number | null;
}

export interface NormalizedListing extends ParsedListing {
  trimNormalized: string | null;
}
