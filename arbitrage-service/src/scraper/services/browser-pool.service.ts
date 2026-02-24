import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Browser, Page, chromium } from 'playwright';

/**
 * Manages a pool of Playwright browser instances.
 * Limits concurrent browsers to prevent resource exhaustion.
 */
@Injectable()
export class BrowserPoolService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private activePages = 0;
  private readonly maxInstances: number;
  private waitQueue: Array<() => void> = [];

  constructor(private configService: ConfigService) {
    this.maxInstances = this.configService.get<number>(
      'scraper.maxBrowsers',
      3,
    );
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async acquirePage(): Promise<Page> {
    if (this.activePages >= this.maxInstances) {
      await new Promise<void>((resolve) => {
        this.waitQueue.push(resolve);
      });
    }

    this.activePages++;
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    return page;
  }

  async releasePage(page: Page): Promise<void> {
    try {
      await page.close();
    } catch {
      // Page may already be closed
    }
    this.activePages--;

    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      next?.();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
