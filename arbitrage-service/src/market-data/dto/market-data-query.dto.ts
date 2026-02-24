import { z } from 'zod';

export const MarketDataQuerySchema = z.object({
  make: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(50).optional(),
  yearMin: z.coerce.number().int().min(1900).max(2030).optional(),
  yearMax: z.coerce.number().int().min(1900).max(2030).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().optional(),
  state: z.string().max(2).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z
    .enum(['price', 'year', 'mileage', 'daysOnMarket', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type MarketDataQuery = z.infer<typeof MarketDataQuerySchema>;
