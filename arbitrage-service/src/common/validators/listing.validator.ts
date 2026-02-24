import { z } from 'zod';

export const RawScrapedListingSchema = z.object({
  vin: z.string().min(17).max(17).optional(),
  make: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(50).optional(),
  year: z.union([z.number().int().min(1900).max(2030), z.string()]).optional(),
  trim: z.string().max(100).optional(),
  price: z.string().optional(),
  mileage: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),
  condition: z.string().max(20).optional(),
  titleStatus: z.string().max(20).optional(),
  source: z.string().min(1).max(30),
  sourceUrl: z.string().max(500).optional(),
  daysOnMarket: z.union([z.number().int().min(0), z.string()]).optional(),
});

export type ValidatedRawListing = z.infer<typeof RawScrapedListingSchema>;

/**
 * Validates a raw scraped listing. Returns the validated data or null if invalid.
 */
export function validateRawListing(
  data: unknown,
): ValidatedRawListing | null {
  const result = RawScrapedListingSchema.safeParse(data);
  if (!result.success) return null;

  const listing = result.data;

  // Must have VIN, make, model, year, price, and mileage
  if (!listing.vin || !listing.make || !listing.model || !listing.year || !listing.price || !listing.mileage) {
    return null;
  }

  return listing;
}
