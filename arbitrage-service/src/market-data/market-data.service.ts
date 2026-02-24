import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MarketDataQuery } from './dto/market-data-query.dto';
import {
  MarketDataResponse,
  MarketDataStatsResponse,
} from './dto/market-data-response.dto';

@Injectable()
export class MarketDataService {
  constructor(private prisma: PrismaService) {}

  async getMarketData(query: MarketDataQuery): Promise<MarketDataResponse> {
    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder);
    const skip = (query.page - 1) * query.limit;

    const [listings, total, stats] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
      }),
      this.prisma.listing.count({ where }),
      this.computeStats(query),
    ]);

    return {
      listings,
      stats,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private buildWhereClause(
    query: MarketDataQuery,
  ): Prisma.ListingWhereInput {
    const where: Prisma.ListingWhereInput = {
      isActive: true,
    };

    if (query.make) where.make = { equals: query.make, mode: 'insensitive' };
    if (query.model) where.model = { equals: query.model, mode: 'insensitive' };
    if (query.state) where.state = query.state;

    if (query.yearMin || query.yearMax) {
      where.year = {};
      if (query.yearMin) where.year.gte = query.yearMin;
      if (query.yearMax) where.year.lte = query.yearMax;
    }

    if (query.priceMin || query.priceMax) {
      where.price = {};
      if (query.priceMin) where.price.gte = query.priceMin;
      if (query.priceMax) where.price.lte = query.priceMax;
    }

    return where;
  }

  private buildOrderBy(
    sortBy: string,
    sortOrder: string,
  ): Prisma.ListingOrderByWithRelationInput {
    return { [sortBy]: sortOrder };
  }

  /**
   * Computes aggregate stats using a single SQL query with PERCENTILE_CONT and STDDEV_POP.
   * Prisma ORM's aggregate() does not support these window/ordered-set functions natively,
   * so we use $queryRaw with Prisma.sql template tags (safe from injection).
   */
  private async computeStats(
    query: MarketDataQuery,
  ): Promise<MarketDataStatsResponse> {
    const makeFilter = query.make
      ? Prisma.sql`AND LOWER(make) = LOWER(${query.make})`
      : Prisma.empty;
    const modelFilter = query.model
      ? Prisma.sql`AND LOWER(model) = LOWER(${query.model})`
      : Prisma.empty;
    const stateFilter = query.state
      ? Prisma.sql`AND state = ${query.state}`
      : Prisma.empty;
    const yearMinFilter = query.yearMin
      ? Prisma.sql`AND year >= ${query.yearMin}`
      : Prisma.empty;
    const yearMaxFilter = query.yearMax
      ? Prisma.sql`AND year <= ${query.yearMax}`
      : Prisma.empty;
    const priceMinFilter = query.priceMin
      ? Prisma.sql`AND price >= ${query.priceMin}`
      : Prisma.empty;
    const priceMaxFilter = query.priceMax
      ? Prisma.sql`AND price <= ${query.priceMax}`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        avg_price: number;
        median_price: number;
        min_price: number;
        max_price: number;
        std_dev: number;
        count: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          AVG(price)::int                                                    AS avg_price,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::int           AS median_price,
          MIN(price)                                                         AS min_price,
          MAX(price)                                                         AS max_price,
          COALESCE(STDDEV_POP(price), 0)                                    AS std_dev,
          COUNT(*)                                                           AS count
        FROM listings
        WHERE is_active = true
        ${makeFilter}
        ${modelFilter}
        ${stateFilter}
        ${yearMinFilter}
        ${yearMaxFilter}
        ${priceMinFilter}
        ${priceMaxFilter}
      `,
    );

    const row = rows[0];
    if (!row || row.count === 0n) {
      return { avgPrice: 0, medianPrice: 0, minPrice: 0, maxPrice: 0, stdDev: 0, count: 0 };
    }

    return {
      avgPrice: row.avg_price ?? 0,
      medianPrice: row.median_price ?? 0,
      minPrice: row.min_price ?? 0,
      maxPrice: row.max_price ?? 0,
      stdDev: Math.round(Number(row.std_dev) ?? 0),
      count: Number(row.count),
    };
  }
}
