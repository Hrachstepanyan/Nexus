import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Applies random delays between scraper requests to avoid detection.
 */
@Injectable()
export class RateLimiterService {
  private readonly minMs: number;
  private readonly maxMs: number;

  constructor(private configService: ConfigService) {
    this.minMs = this.configService.get<number>(
      'scraper.rateLimitMinMs',
      2000,
    );
    this.maxMs = this.configService.get<number>(
      'scraper.rateLimitMaxMs',
      5000,
    );
  }

  async wait(): Promise<void> {
    const delay =
      Math.floor(Math.random() * (this.maxMs - this.minMs + 1)) + this.minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  getRandomDelay(): number {
    return (
      Math.floor(Math.random() * (this.maxMs - this.minMs + 1)) + this.minMs
    );
  }
}
