/**
 * Brain management routes
 *
 * TODO: Future enhancements (see ROADMAP.md for details)
 * - Add authentication middleware for protected routes
 * - Implement rate limiting per user
 * - Add batch operations (bulk upload, bulk delete)
 * - Add document versioning support
 * - Implement access control (public/private/shared brains)
 * - Add brain cloning functionality
 * - Implement brain export/import
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import { default as nodeFormData } from 'form-data';
import fs from 'fs';
import { quivrClient } from '../client/quivr-client.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { upload, cleanupFiles, getFileStats } from '../middleware/upload.js';
import {
  BrainCreateSchema,
  QueryRequestSchema,
} from '../types/schemas.js';

export const brainsRouter = Router();

/**
 * POST /brains - Create a new brain
 */
brainsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const brainData = BrainCreateSchema.parse(req.body);
    const brain = await quivrClient.createBrain(brainData);
    res.status(201).json(brain);
  }),
);

/**
 * GET /brains - List all brains
 */
brainsRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const brains = await quivrClient.listBrains();
    res.json(brains);
  }),
);

/**
 * GET /brains/:id - Get brain details
 */
brainsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const brain = await quivrClient.getBrain(req.params.id);
    res.json(brain);
  }),
);

/**
 * DELETE /brains/:id - Delete a brain
 */
brainsRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await quivrClient.deleteBrain(req.params.id);
    res.status(204).send();
  }),
);

/**
 * POST /brains/:id/documents - Upload documents
 */
brainsRouter.post(
  '/:id/documents',
  upload.array('files', 20),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'No files provided',
      });
      return;
    }

    try {
      // Create FormData for Python service
      // eslint-disable-next-line new-cap
      const form = new nodeFormData();

      files.forEach((file) => {
        form.append('files', fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      // Forward to Python service
      const result = await quivrClient.uploadDocumentsWithFormData(
        req.params.id,
        form,
      );

      // Cleanup uploaded files
      cleanupFiles(files);

      // Return success with file statistics
      res.status(201).json({
        ...result,
        files: files.map(getFileStats),
      });
    } catch (error) {
      // Cleanup files on error
      cleanupFiles(files);
      throw error;
    }
  }),
);

/**
 * POST /brains/:id/query - Query a brain
 */
brainsRouter.post(
  '/:id/query',
  asyncHandler(async (req: Request, res: Response) => {
    const query = QueryRequestSchema.parse(req.body);
    const result = await quivrClient.queryBrain(req.params.id, query);
    res.json(result);
  }),
);

/**
 * GET /brains/:id/documents - List documents in a brain
 */
brainsRouter.get(
  '/:id/documents',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await quivrClient.listDocuments(req.params.id);
    res.json(result);
  }),
);

/**
 * GET /brains/:id/documents/:name - Get document metadata
 */
brainsRouter.get(
  '/:id/documents/:name',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await quivrClient.getDocument(
      req.params.id,
      req.params.name,
    );
    res.json(result);
  }),
);

/**
 * DELETE /brains/:id/documents/:name - Delete a document
 */
brainsRouter.delete(
  '/:id/documents/:name',
  asyncHandler(async (req: Request, res: Response) => {
    await quivrClient.deleteDocument(req.params.id, req.params.name);
    res.status(204).send();
  }),
);
