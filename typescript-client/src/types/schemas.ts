/**
 * TypeScript types and Zod schemas for API validation
 */
import { z } from 'zod';

// Zod schemas for runtime validation
export const BrainCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  llm_provider: z.enum(['anthropic', 'openai', 'mistral']).default('anthropic'),
  model: z.string().default('claude-3-5-sonnet-20241022'),
});

export const BrainResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  llm_provider: z.string(),
  model: z.string(),
  document_count: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const BrainListSchema = z.object({
  brains: z.array(BrainResponseSchema),
  total: z.number().int().min(0),
});

export const QueryRequestSchema = z.object({
  question: z.string().min(1).max(2000),
  max_tokens: z.number().int().min(100)
    .max(4096)
    .default(1024),
  temperature: z.number().min(0).max(1)
    .default(0.7),
});

export const QueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).default([]),
  tokens_used: z.number().int().nullable(),
  processing_time_ms: z.number().int(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  detail: z.string().optional(),
  request_id: z.string().uuid().optional(),
});

export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  version: z.string(),
  timestamp: z.string().datetime(),
});

export const DocumentMetadataSchema = z.object({
  name: z.string(),
  size: z.number(),
  created_at: z.string().datetime(),
  modified_at: z.string().datetime(),
  path: z.string(),
});

export const DocumentListSchema = z.object({
  documents: z.array(DocumentMetadataSchema),
  total: z.number().int().min(0),
});

export const FileUploadResponseSchema = z.object({
  message: z.string(),
  files: z.array(z.object({
    originalName: z.string(),
    size: z.number(),
    mimeType: z.string(),
    extension: z.string(),
    uploadedAt: z.string(),
  })),
  brain_id: z.string().uuid(),
});

// Infer TypeScript types from Zod schemas
export type BrainCreate = z.infer<typeof BrainCreateSchema>;
export type BrainResponse = z.infer<typeof BrainResponseSchema>;
export type BrainList = z.infer<typeof BrainListSchema>;
export type QueryRequest = z.infer<typeof QueryRequestSchema>;
export type QueryResponse = z.infer<typeof QueryResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type DocumentList = z.infer<typeof DocumentListSchema>;
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
