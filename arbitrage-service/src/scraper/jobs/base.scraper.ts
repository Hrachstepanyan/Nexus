import { RawScrapedListing } from '../../common/types/listing.types';

export interface ScraperOptions {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  zipCode?: string;
  radius?: number;
  maxPages?: number;
}

export abstract class BaseScraper {
  abstract readonly source: string;

  abstract scrape(options: ScraperOptions): Promise<RawScrapedListing[]>;
}
