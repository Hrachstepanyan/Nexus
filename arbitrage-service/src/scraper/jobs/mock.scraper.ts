import { Injectable } from '@nestjs/common';
import { BaseScraper, ScraperOptions } from './base.scraper';
import { RawScrapedListing } from '../../common/types/listing.types';
import { SOURCES } from '../../common/constants/sources';

const MAKES_MODELS: Array<{ make: string; models: string[] }> = [
  { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'] },
  { make: 'Honda', models: ['Civic', 'Accord', 'CR-V', 'Pilot'] },
  { make: 'BMW', models: ['3 Series', '5 Series', 'X3', 'X5'] },
  { make: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'GLC', 'GLE'] },
  { make: 'Ford', models: ['F-150', 'Mustang', 'Explorer', 'Escape'] },
  { make: 'Chevrolet', models: ['Silverado', 'Camaro', 'Equinox', 'Tahoe'] },
  { make: 'Audi', models: ['A4', 'A6', 'Q5', 'Q7'] },
  { make: 'Lexus', models: ['RX', 'ES', 'NX', 'IS'] },
];

const STATES = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'WA'];
const TRIMS = ['Base', 'Sport', 'Limited', 'Premium', 'SE', 'XLE', 'EX-L', 'M-Sport'];
const CONDITIONS = ['Excellent', 'Good', 'Fair'];
const TITLE_STATUSES = ['Clean', 'Salvage', 'Rebuilt'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

@Injectable()
export class MockScraper extends BaseScraper {
  readonly source = SOURCES.MOCK;

  async scrape(options: ScraperOptions): Promise<RawScrapedListing[]> {
    const count = 200;
    const listings: RawScrapedListing[] = [];

    for (let i = 0; i < count; i++) {
      const makeModel = options.make
        ? MAKES_MODELS.find((m) => m.make === options.make) ?? randomElement(MAKES_MODELS)
        : randomElement(MAKES_MODELS);
      const model = options.model ?? randomElement(makeModel.models);
      const year = randomInt(
        options.yearMin ?? 2018,
        options.yearMax ?? 2025,
      );
      const mileage = randomInt(5000, 120000);
      // Price correlates roughly with year and mileage
      const basePrice = 15000 + (year - 2018) * 3000 - mileage * 0.05;
      const jitter = basePrice * (Math.random() * 0.3 - 0.15);
      const price = Math.max(5000, Math.round(basePrice + jitter));

      listings.push({
        vin: generateVIN(),
        make: makeModel.make,
        model: model,
        year: year,
        trim: randomElement(TRIMS),
        price: `$${price.toLocaleString()}`,
        mileage: `${mileage.toLocaleString()} mi`,
        city: `City${randomInt(1, 50)}`,
        state: randomElement(STATES),
        zipCode: `${randomInt(10000, 99999)}`,
        condition: randomElement(CONDITIONS),
        titleStatus: Math.random() > 0.1 ? 'Clean' : randomElement(TITLE_STATUSES),
        source: this.source,
        sourceUrl: `https://mock.example.com/listing/${i}`,
        daysOnMarket: randomInt(1, 90),
      });
    }

    return listings;
  }
}
