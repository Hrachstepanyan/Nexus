/**
 * File upload middleware configuration
 */
import multer from 'multer';
import type { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Allowed file types for document upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/json',
] as const;

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.doc',
  '.docx',
  '.csv',
  '.json',
] as const;

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Maximum number of files per upload
const MAX_FILES = 20;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  // Check file extension
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    cb(new Error(`File type not allowed: ${ext}. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    cb(new Error(`MIME type not allowed: ${mimeType}`));
    return;
  }

  cb(null, true);
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

/**
 * Cleanup uploaded files
 */
export const cleanupFiles = (files: Express.Multer.File[]): void => {
  files.forEach((file) => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${file.path}:`, error);
    }
  });
};

/**
 * Get file statistics
 */
export const getFileStats = (file: Express.Multer.File) => ({
  originalName: file.originalname,
  size: file.size,
  mimeType: file.mimetype,
  extension: path.extname(file.originalname),
  uploadedAt: new Date().toISOString(),
});
