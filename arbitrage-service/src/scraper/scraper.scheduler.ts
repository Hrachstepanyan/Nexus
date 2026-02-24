import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { ScrapePipeline } from './pipeline/scrape.pipeline';
import { AutotraderScraper } from './jobs/autotrader.scraper';
import { MockScraper } from './jobs/mock.scraper';

@Injectable()
export class ScraperScheduler {
  private isRunning = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private pipeline: ScrapePipeline,
    private autotraderScraper: AutotraderScraper,
    private mockScraper: MockScraper,
  ) {}

  /** Nightly Autotrader scrape at 1:00 AM */
  @Cron('0 1 * * *')
  async runNightlyScrape(): Promise<void> {
    if (this.isRunning) {
      console.log('Scraper already running, skipping...');
      return;
    }

    this.isRunning = true;
    try {
      const useMock = this.configService.get<boolean>('scraper.useMock', true);
      const scraper = useMock ? this.mockScraper : this.autotraderScraper;

      console.log(`Starting nightly scrape with ${scraper.source}...`);
      const rawListings = await scraper.scrape({});
      const result = await this.pipeline.process(rawListings);

      console.log('Nightly scrape complete:', result);
    } catch (error) {
      console.error('Nightly scrape failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /** Recompute market aggregates at 6:00 AM (after all scrapers finish) */
  @Cron('0 6 * * *')
  async recomputeAggregates(): Promise<void> {
    console.log('Recomputing market aggregates...');
    try {
      // Raw SQL is required here because Prisma ORM's aggregate() does not support
      // ordered-set aggregate functions (PERCENTILE_CONT) or STDDEV_POP natively.
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO market_aggregates (make, model, year, trim, region, avg_price, median_price, min_price, max_price, std_dev, listing_count, computed_date)
        SELECT
          make,
          model,
          year,
          trim_normalized AS trim,
          state AS region,
          AVG(price)::int AS avg_price,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::int AS median_price,
          MIN(price) AS min_price,
          MAX(price) AS max_price,
          COALESCE(STDDEV_POP(price), 0) AS std_dev,
          COUNT(*)::int AS listing_count,
          NOW() AS computed_date
        FROM listings
        WHERE is_active = true
        GROUP BY make, model, year, trim_normalized, state
        HAVING COUNT(*) >= 3
      `);
      console.log('Market aggregates recomputed');
    } catch (error) {
      console.error('Aggregate computation failed:', error);
    }
  }

  /** Mark stale listings as inactive at 8:00 AM */
  @Cron('0 8 * * *')
  async markStaleListings(): Promise<void> {
    console.log('Marking stale listings...');
    try {
      const result = await this.prisma.listing.updateMany({
        where: {
          isActive: true,
          updatedAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        },
        data: { isActive: false },
      });
      console.log(`Marked ${result.count} listings as inactive`);
    } catch (error) {
      console.error('Stale listing cleanup failed:', error);
    }
  }

  /** Manual trigger for a specific scraper source */
  async runManual(source: string): Promise<{
    processed: number;
    skipped: number;
    deduped: number;
    upserted: number;
    priceChanges: number;
  }> {
    const useMock = source === 'mock' || this.configService.get<boolean>('scraper.useMock', true);
    const scraper = useMock ? this.mockScraper : this.autotraderScraper;

    const rawListings = await scraper.scrape({});
    return this.pipeline.process(rawListings);
  }
}
