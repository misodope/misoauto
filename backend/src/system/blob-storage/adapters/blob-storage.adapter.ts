/**
 * Blob Storage Adapter Interface
 *
 * Defines the contract for blob storage providers.
 * Implement this interface to add support for new providers.
 */

import { UploadOptions, UploadResult } from '../blob-storage.types';

export interface IBlobStorageAdapter {
  /** Upload a file */
  upload(
    key: string,
    data: Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  /** Download a file */
  download(key: string): Promise<Buffer>;

  /** Delete a file */
  delete(key: string): Promise<void>;

  /** Check if a file exists */
  exists(key: string): Promise<boolean>;

  /** Get a signed URL for downloading */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /** Get public URL for a file */
  getPublicUrl(key: string): string;
}
