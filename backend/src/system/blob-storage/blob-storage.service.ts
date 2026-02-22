import { Injectable, Inject } from '@nestjs/common';
import { Readable } from 'stream';
import { IBlobStorageAdapter } from './adapters/blob-storage.adapter';
import {
  BLOB_STORAGE_ADAPTER,
  UploadOptions,
  UploadResult,
  PresignedUploadResult,
} from './blob-storage.types';

@Injectable()
export class BlobStorageService {
  constructor(
    @Inject(BLOB_STORAGE_ADAPTER)
    private readonly adapter: IBlobStorageAdapter,
  ) {}

  async upload(
    key: string,
    data: Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    return this.adapter.upload(key, data, options);
  }

  async download(key: string): Promise<Buffer> {
    return this.adapter.download(key);
  }

  async downloadStream(key: string): Promise<{
    stream: Readable;
    contentLength: number;
    contentType: string;
  }> {
    return this.adapter.downloadStream(key);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.adapter.exists(key);
  }

  async getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    return this.adapter.getSignedDownloadUrl(key, expiresIn);
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<PresignedUploadResult> {
    return this.adapter.getSignedUploadUrl(key, contentType, expiresIn);
  }

  getPublicUrl(key: string): string {
    return this.adapter.getPublicUrl(key);
  }
}
