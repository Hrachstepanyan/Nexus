import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Round-robin proxy rotation from PROXY_LIST env var.
 * Returns null in dev when no proxies are configured.
 */
@Injectable()
export class ProxyRotationService {
  private readonly proxies: string[];
  private currentIndex = 0;

  constructor(private configService: ConfigService) {
    this.proxies = this.configService.get<string[]>('scraper.proxyList', []);
  }

  getNextProxy(): string | null {
    if (this.proxies.length === 0) return null;

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  hasProxies(): boolean {
    return this.proxies.length > 0;
  }

  getProxyCount(): number {
    return this.proxies.length;
  }
}
