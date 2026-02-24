import { Controller, Post, Param } from '@nestjs/common';
import { ScraperScheduler } from './scraper.scheduler';

@Controller('admin/scraper')
export class ScraperController {
  constructor(private scheduler: ScraperScheduler) {}

  @Post('run/:source')
  async triggerScrape(@Param('source') source: string) {
    const result = await this.scheduler.runManual(source);
    return {
      message: `Scrape completed for source: ${source}`,
      ...result,
    };
  }

  @Post('aggregates')
  async recomputeAggregates() {
    await this.scheduler.recomputeAggregates();
    return { message: 'Market aggregates recomputed' };
  }
}
