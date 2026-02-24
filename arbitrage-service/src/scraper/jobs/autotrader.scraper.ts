import { Injectable } from '@nestjs/common';
import { Page } from 'playwright';
import { BaseScraper, ScraperOptions } from './base.scraper';
import { RawScrapedListing } from '../../common/types/listing.types';
import { BrowserPoolService } from '../services/browser-pool.service';
import { RateLimiterService } from '../services/rate-limiter.service';
import { AutotraderParser } from '../parsers/autotrader.parser';
import { SOURCES } from '../../common/constants/sources';

@Injectable()
export class AutotraderScraper extends BaseScraper {
  readonly source = SOURCES.AUTOTRADER;

  constructor(
    private browserPool: BrowserPoolService,
    private rateLimiter: RateLimiterService,
    private parser: AutotraderParser,
  ) {
    super();
  }

  async scrape(options: ScraperOptions): Promise<RawScrapedListing[]> {
    const allListings: RawScrapedListing[] = [];
    const maxPages = options.maxPages ?? 5;
    let page: Page | null = null;

    try {
      page = await this.browserPool.acquirePage();

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = this.buildUrl(options, pageNum);
        console.log(`Scraping Autotrader page ${pageNum}: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await this.rateLimiter.wait();

        const html = await page.content();
        const listings = this.parser.parseListingsPage(html);

        if (listings.length === 0) break;
        allListings.push(...listings);
      }
    } catch (error) {
      console.error('Autotrader scraping error:', error);
    } finally {
      if (page) {
        await this.browserPool.releasePage(page);
      }
    }

    return allListings;
  }

  private buildUrl(options: ScraperOptions, pageNum: number): string {
    const params = new URLSearchParams();
    if (options.make) params.set('makeCodeList', options.make.toUpperCase());
    if (options.model) params.set('modelCodeList', options.model.toUpperCase());
    if (options.yearMin) params.set('startYear', String(options.yearMin));
    if (options.yearMax) params.set('endYear', String(options.yearMax));
    if (options.zipCode) params.set('zip', options.zipCode);
    if (options.radius) params.set('searchRadius', String(options.radius));
    if (pageNum > 1) params.set('firstRecord', String((pageNum - 1) * 25));

    return `https://www.autotrader.com/cars-for-sale/all-cars?${params.toString()}`;
  }
}
