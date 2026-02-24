import { Injectable } from '@nestjs/common';
import { RawScrapedListing } from '../../common/types/listing.types';
import { SOURCES } from '../../common/constants/sources';

/**
 * Parses Autotrader HTML listing pages into RawScrapedListing objects.
 * CSS selectors target the listing card structure.
 */
@Injectable()
export class AutotraderParser {
  parseListingsPage(html: string): RawScrapedListing[] {
    const listings: RawScrapedListing[] = [];

    // Simple regex-based extraction for listing cards
    // In production, use a proper HTML parser like cheerio
    const cardPattern = /data-cmp="inventoryListing"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    const cards = html.match(cardPattern) ?? [];

    for (const card of cards) {
      try {
        const listing = this.parseCard(card);
        if (listing) listings.push(listing);
      } catch {
        // Skip unparseable cards
      }
    }

    return listings;
  }

  private parseCard(cardHtml: string): RawScrapedListing | null {
    const title = this.extractText(cardHtml, /class="[^"]*title[^"]*"[^>]*>([^<]+)/);
    const price = this.extractText(cardHtml, /class="[^"]*price[^"]*"[^>]*>\s*([^<]+)/);
    const mileage = this.extractText(cardHtml, /(\d[\d,]+)\s*mi/);
    const vin = this.extractText(cardHtml, /VIN:\s*([A-HJ-NPR-Z0-9]{17})/i);

    if (!title || !price) return null;

    const parsed = this.parseTitleLine(title);

    return {
      vin: vin ?? undefined,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      trim: parsed.trim,
      price: price.trim(),
      mileage: mileage ?? undefined,
      source: SOURCES.AUTOTRADER,
      sourceUrl: undefined,
    };
  }

  private parseTitleLine(title: string): {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
  } {
    const parts = title.trim().split(/\s+/);
    if (parts.length < 3) return {};

    return {
      year: parts[0],
      make: parts[1],
      model: parts[2],
      trim: parts.length > 3 ? parts.slice(3).join(' ') : undefined,
    };
  }

  private extractText(html: string, pattern: RegExp): string | null {
    const match = html.match(pattern);
    return match?.[1]?.trim() ?? null;
  }
}
