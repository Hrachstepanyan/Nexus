/**
 * Type-safe client for Quivr Brain Service
 */
import type { AxiosInstance, AxiosError } from 'axios';
import axios from 'axios';
import type { default as nodeFormData } from 'form-data';
import { env } from '../config/environment.js';
import type {
  BrainCreate,
  BrainResponse,
  BrainList,
  QueryRequest,
  QueryResponse,
  HealthResponse,
  DocumentList,
  DocumentMetadata,
} from '../types/schemas.js';
import {
  BrainResponseSchema,
  BrainListSchema,
  QueryResponseSchema,
  HealthResponseSchema,
  DocumentListSchema,
  DocumentMetadataSchema,
} from '../types/schemas.js';

interface UploadResult {
  message: string;
  files: string[];
  brain_id: string;
}

export class QuivrClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'QuivrClientError';
  }
}

export class QuivrClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string = env.QUIVR_SERVICE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 60000, // 60 seconds for LLM operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const errorData = error.response?.data as { detail?: string } | undefined;
        const message = errorData?.detail ?? error.message;

        throw new QuivrClientError(
          message,
          error.response?.status,
          error.response?.data,
        );
      },
    );
  }

  /**
   * Check service health
   */
  async health(): Promise<HealthResponse> {
    const { data } = await this.client.get<HealthResponse>('/health');
    return HealthResponseSchema.parse(data);
  }

  /**
   * Create a new brain
   */
  async createBrain(brainData: BrainCreate): Promise<BrainResponse> {
    const { data } = await this.client.post<BrainResponse>('/brains', brainData);
    return BrainResponseSchema.parse(data);
  }

  /**
   * Get all brains
   */
  async listBrains(): Promise<BrainList> {
    const { data } = await this.client.get<BrainList>('/brains');
    return BrainListSchema.parse(data);
  }

  /**
   * Get brain by ID
   */
  async getBrain(brainId: string): Promise<BrainResponse> {
    const { data } = await this.client.get<BrainResponse>(`/brains/${brainId}`);
    return BrainResponseSchema.parse(data);
  }

  /**
   * Delete a brain
   */
  async deleteBrain(brainId: string): Promise<void> {
    await this.client.delete(`/brains/${brainId}`);
  }

  /**
   * Upload documents to a brain
   */
  async uploadDocuments(
    brainId: string,
    files: File[] | Buffer[],
    filenames?: string[],
  ): Promise<UploadResult> {
    const formData = new FormData();

    files.forEach((file, index) => {
      if (file instanceof File) {
        formData.append('files', file);
      } else {
        // Buffer case (Node.js)
        const filename = filenames?.[index] ?? `file-${index}`;
        const blob = new Blob([file]);
        formData.append('files', blob, filename);
      }
    });

    const { data } = await this.client.post<UploadResult>(
      `/brains/${brainId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
  }

  /**
   * Upload documents with FormData (Node.js specific)
   */
  async uploadDocumentsWithFormData(
    brainId: string,
    formData: nodeFormData,
  ): Promise<UploadResult> {
    const { data } = await this.client.post<UploadResult>(
      `/brains/${brainId}/documents`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    return data;
  }

  /**
   * Query a brain with a question
   */
  async queryBrain(
    brainId: string,
    query: QueryRequest,
  ): Promise<QueryResponse> {
    const { data } = await this.client.post<QueryResponse>(`/brains/${brainId}/query`, query);
    return QueryResponseSchema.parse(data);
  }

  /**
   * List all documents in a brain
   */
  async listDocuments(brainId: string): Promise<DocumentList> {
    const { data } = await this.client.get<DocumentList>(`/brains/${brainId}/documents`);
    return DocumentListSchema.parse(data);
  }

  /**
   * Get metadata for a specific document
   */
  async getDocument(brainId: string, documentName: string): Promise<DocumentMetadata> {
    const { data } = await this.client.get<DocumentMetadata>(`/brains/${brainId}/documents/${encodeURIComponent(documentName)}`);
    return DocumentMetadataSchema.parse(data);
  }

  /**
   * Delete a specific document from a brain
   */
  async deleteDocument(brainId: string, documentName: string): Promise<void> {
    await this.client.delete(`/brains/${brainId}/documents/${encodeURIComponent(documentName)}`);
  }
}

// Singleton instance
export const quivrClient = new QuivrClient();
