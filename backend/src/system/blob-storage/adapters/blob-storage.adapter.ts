/**
 * Blob Storage Adapter Interface
 *
 * Defines the contract for blob storage providers.
 * Implement this interface to add support for new providers.
 */

import {
  UploadOptions,
  UploadResult,
  PresignedUploadResult,
} from '../blob-storage.types';

export interface IBlobStorageAdapter {
  /** Upload a file (server-side) */
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

  /** Get a presigned URL for downloading */
  getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  /** Get a presigned URL for uploading (client-side direct upload) */
  getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<PresignedUploadResult>;

  /** Get public URL for a file */
  getPublicUrl(key: string): string;
}
