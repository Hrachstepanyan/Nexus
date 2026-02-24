import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RawScrapedListing, NormalizedListing } from '../../common/types/listing.types';
import { validateRawListing } from '../../common/validators/listing.validator';
import { parsePrice } from '../../common/parsers/price.parser';
import { parseMileage } from '../../common/parsers/mileage.parser';
import { normalizeTrim } from '../../common/parsers/trim.normalizer';
import { isValidVINFormat } from '../../common/parsers/vin.validator';
import { filterOutliers } from '../../common/filters/outlier.filter';

@Injectable()
export class ScrapePipeline {
  constructor(private prisma: PrismaService) {}

  async process(rawListings: RawScrapedListing[]): Promise<{
    processed: number;
    skipped: number;
    deduped: number;
    upserted: number;
    priceChanges: number;
  }> {
    let skipped = 0;
    let upserted = 0;
    let priceChanges = 0;

    // Step 1: Validate
    const validated = rawListings
      .map((raw) => {
        const result = validateRawListing(raw);
        if (!result) skipped++;
        return result;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // Step 2: Parse and normalize
    const parsed = validated
      .map((v) => this.parseAndNormalize(v))
      .filter((p): p is NormalizedListing => p !== null);

    // Step 3: Deduplicate by VIN
    const deduped = this.deduplicateByVIN(parsed);
    const dedupedCount = parsed.length - deduped.length;

    // Step 4: Filter outliers
    const filtered = filterOutliers(deduped, (l) => l.price);

    // Step 5: Upsert to DB
    for (const listing of filtered) {
      const result = await this.upsertListing(listing);
      if (result.upserted) upserted++;
      if (result.priceChanged) priceChanges++;
    }

    return {
      processed: rawListings.length,
      skipped,
      deduped: dedupedCount,
      upserted,
      priceChanges,
    };
  }

  private parseAndNormalize(
    raw: ReturnType<typeof validateRawListing>,
  ): NormalizedListing | null {
    if (!raw) return null;

    const vin = raw.vin?.toUpperCase();
    if (!vin || !isValidVINFormat(vin)) return null;

    const price = parsePrice(raw.price);
    const mileage = parseMileage(raw.mileage);
    if (price === null || mileage === null) return null;

    const year =
      typeof raw.year === 'string' ? parseInt(raw.year, 10) : raw.year;
    if (!year || isNaN(year)) return null;

    const trimNormalized = normalizeTrim(raw.trim);

    return {
      vin,
      make: raw.make!,
      model: raw.model!,
      year,
      trim: raw.trim ?? null,
      trimNormalized,
      price,
      mileage,
      city: raw.city ?? null,
      state: raw.state ?? null,
      zipCode: raw.zipCode ?? null,
      condition: raw.condition ?? null,
      titleStatus: raw.titleStatus ?? null,
      source: raw.source,
      sourceUrl: raw.sourceUrl ?? null,
      daysOnMarket: raw.daysOnMarket
        ? typeof raw.daysOnMarket === 'string'
          ? parseInt(raw.daysOnMarket, 10)
          : raw.daysOnMarket
        : null,
    };
  }

  private deduplicateByVIN(listings: NormalizedListing[]): NormalizedListing[] {
    const seen = new Map<string, NormalizedListing>();
    for (const listing of listings) {
      // Keep the listing with the most recent data (last seen wins)
      seen.set(listing.vin, listing);
    }
    return Array.from(seen.values());
  }

  private async upsertListing(
    listing: NormalizedListing,
  ): Promise<{ upserted: boolean; priceChanged: boolean }> {
    let priceChanged = false;

    // Check existing listing for price change detection
    const existing = await this.prisma.listing.findUnique({
      where: { vin: listing.vin },
      select: { price: true },
    });

    if (existing && existing.price !== listing.price) {
      priceChanged = true;
    }

    await this.prisma.listing.upsert({
      where: { vin: listing.vin },
      update: {
        price: listing.price,
        mileage: listing.mileage,
        daysOnMarket: listing.daysOnMarket,
        isActive: true,
        condition: listing.condition,
        titleStatus: listing.titleStatus,
      },
      create: {
        vin: listing.vin,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        trim: listing.trim,
        trimNormalized: listing.trimNormalized,
        price: listing.price,
        mileage: listing.mileage,
        city: listing.city,
        state: listing.state,
        zipCode: listing.zipCode,
        condition: listing.condition,
        titleStatus: listing.titleStatus,
        source: listing.source,
        sourceUrl: listing.sourceUrl,
        daysOnMarket: listing.daysOnMarket,
        isActive: true,
      },
    });

    // Insert price snapshot if price changed or new listing
    if (priceChanged || !existing) {
      await this.prisma.priceSnapshot.create({
        data: {
          vin: listing.vin,
          price: listing.price,
          mileage: listing.mileage,
          source: listing.source,
          snapshotDate: new Date(),
        },
      });
    }

    return { upserted: true, priceChanged };
  }
}
