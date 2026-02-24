import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScatterQuery } from './dto/scatter-query.dto';
import { ScatterResponse } from './dto/scatter-response.dto';
import { linearRegression } from '../valuations/math/linear-regression';
import { calculateDealScore } from '../valuations/math/deal-score';
import { computeStatsFromValues } from '../common/utils/stats.util';

@Injectable()
export class ChartsService {
  constructor(private prisma: PrismaService) {}

  async getScatterData(query: ScatterQuery): Promise<ScatterResponse> {
    const listings = await this.prisma.listing.findMany({
      where: {
        make: { equals: query.make, mode: 'insensitive' },
        model: { equals: query.model, mode: 'insensitive' },
        isActive: true,
        ...(query.yearMin || query.yearMax
          ? {
              year: {
                ...(query.yearMin ? { gte: query.yearMin } : {}),
                ...(query.yearMax ? { lte: query.yearMax } : {}),
              },
            }
          : {}),
      },
      select: {
        vin: true,
        price: true,
        mileage: true,
        year: true,
        trim: true,
        daysOnMarket: true,
      },
    });

    // Compute regression
    const points = listings.map((l) => ({ x: l.mileage, y: l.price }));
    const regression = linearRegression(points);

    // Compute stats from in-memory prices (dataset already fetched for scatter points)
    const prices = listings.map((l) => l.price);
    const stats = computeStatsFromValues(prices);

    // Map to scatter points with deal scores
    const scatterPoints = listings.map((l) => {
      const expectedPrice = regression.slope * l.mileage + regression.intercept;
      const deal = calculateDealScore(l.price, expectedPrice, stats.stdDev);
      return {
        vin: l.vin,
        price: l.price,
        mileage: l.mileage,
        year: l.year,
        trim: l.trim,
        dealScore: deal.score,
        daysOnMarket: l.daysOnMarket,
      };
    });

    return {
      points: scatterPoints,
      regression,
      stats,
    };
  }
}
