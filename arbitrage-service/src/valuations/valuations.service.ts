import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { linearRegression } from './math/linear-regression';
import { calculateDealScore } from './math/deal-score';
import { computeMovingAverage } from './math/moving-average';
import { DealScore, RegressionResult, MovingAverageResult } from '../common/types/market.types';

export interface ValuationResult {
  vin?: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  actualPrice?: number;
  estimatedPrice: number;
  dealScore: DealScore;
  regression: RegressionResult;
  marketSignal: MovingAverageResult;
  comparableCount: number;
}

@Injectable()
export class ValuationsService {
  constructor(private prisma: PrismaService) {}

  async getValuationByVIN(vin: string): Promise<ValuationResult> {
    const listing = await this.prisma.listing.findUnique({
      where: { vin: vin.toUpperCase() },
    });

    if (!listing) {
      throw new NotFoundException(`Listing not found for VIN: ${vin}`);
    }

    return this.computeValuation({
      vin: listing.vin,
      make: listing.make,
      model: listing.model,
      year: listing.year,
      mileage: listing.mileage,
      actualPrice: listing.price,
    });
  }

  async estimateValue(params: {
    make: string;
    model: string;
    year: number;
    mileage: number;
  }): Promise<ValuationResult> {
    return this.computeValuation({
      make: params.make,
      model: params.model,
      year: params.year,
      mileage: params.mileage,
    });
  }

  private async computeValuation(params: {
    vin?: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    actualPrice?: number;
  }): Promise<ValuationResult> {
    // Find comparable listings (same make/model, +/- 2 years)
    const comparables = await this.prisma.listing.findMany({
      where: {
        make: { equals: params.make, mode: 'insensitive' },
        model: { equals: params.model, mode: 'insensitive' },
        year: { gte: params.year - 2, lte: params.year + 2 },
        isActive: true,
      },
      select: { price: true, mileage: true },
    });

    // Linear regression: price as function of mileage
    const points = comparables.map((c) => ({
      x: c.mileage,
      y: c.price,
    }));
    const regression = linearRegression(points);

    // Estimated price from regression
    const estimatedPrice = Math.round(
      regression.slope * params.mileage + regression.intercept,
    );

    // Compute stats for deal scoring
    const prices = comparables.map((c) => c.price);
    const mean = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0;
    const stdDev = prices.length > 0
      ? Math.sqrt(
          prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length,
        )
      : 0;

    const actualPrice = params.actualPrice ?? estimatedPrice;
    const dealScore = calculateDealScore(actualPrice, estimatedPrice, stdDev);

    // Moving average from price snapshots
    const snapshots = await this.prisma.priceSnapshot.findMany({
      where: {
        listing: {
          make: { equals: params.make, mode: 'insensitive' },
          model: { equals: params.model, mode: 'insensitive' },
          year: { gte: params.year - 2, lte: params.year + 2 },
        },
      },
      select: { price: true, snapshotDate: true },
      orderBy: { snapshotDate: 'asc' },
    });

    const marketSignal = computeMovingAverage(
      snapshots.map((s) => ({ date: s.snapshotDate, price: s.price })),
    );

    return {
      vin: params.vin,
      make: params.make,
      model: params.model,
      year: params.year,
      mileage: params.mileage,
      actualPrice: params.actualPrice,
      estimatedPrice: Math.max(0, estimatedPrice),
      dealScore,
      regression,
      marketSignal,
      comparableCount: comparables.length,
    };
  }
}
