/**
 * Blob Storage Types
 *
 * Common types for the blob storage abstraction layer.
 */

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
}

export interface PresignedUploadResult {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface BlobStorageConfig {
  provider: 'cloudflare-r2' | 's3' | 'gcs' | 'azure';
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
}

export const BLOB_STORAGE_CONFIG = Symbol('BLOB_STORAGE_CONFIG');
export const BLOB_STORAGE_ADAPTER = Symbol('BLOB_STORAGE_ADAPTER');
