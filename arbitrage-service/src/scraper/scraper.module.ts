import { Module } from '@nestjs/common';
import { BrowserPoolService } from './services/browser-pool.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { ProxyRotationService } from './services/proxy-rotation.service';
import { AutotraderScraper } from './jobs/autotrader.scraper';
import { MockScraper } from './jobs/mock.scraper';
import { AutotraderParser } from './parsers/autotrader.parser';
import { ScrapePipeline } from './pipeline/scrape.pipeline';
import { ScraperScheduler } from './scraper.scheduler';
import { ScraperController } from './scraper.controller';

@Module({
  controllers: [ScraperController],
  providers: [
    BrowserPoolService,
    RateLimiterService,
    ProxyRotationService,
    AutotraderScraper,
    MockScraper,
    AutotraderParser,
    ScrapePipeline,
    ScraperScheduler,
  ],
  exports: [ScrapePipeline, ScraperScheduler],
})
export class ScraperModule {}
