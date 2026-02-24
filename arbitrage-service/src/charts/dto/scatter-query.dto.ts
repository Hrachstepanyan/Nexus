import { z } from 'zod';

export const ScatterQuerySchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  yearMin: z.coerce.number().int().min(1900).max(2030).optional(),
  yearMax: z.coerce.number().int().min(1900).max(2030).optional(),
});

export type ScatterQuery = z.infer<typeof ScatterQuerySchema>;
