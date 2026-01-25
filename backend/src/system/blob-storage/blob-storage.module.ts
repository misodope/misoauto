import { Module, DynamicModule } from '@nestjs/common';
import { BlobStorageService } from './blob-storage.service';
import { CloudflareR2Adapter } from './adapters/cloudflare-r2.adapter';
import {
  BLOB_STORAGE_ADAPTER,
  BLOB_STORAGE_CONFIG,
  BlobStorageConfig,
} from './blob-storage.types';

@Module({})
export class BlobStorageModule {
  static forRoot(config: BlobStorageConfig): DynamicModule {
    const adapterProvider = {
      provide: BLOB_STORAGE_ADAPTER,
      useFactory: () => {
        switch (config.provider) {
          case 'cloudflare-r2':
            return new CloudflareR2Adapter(config);
          default:
            throw new Error(
              `Unsupported blob storage provider: ${config.provider}`,
            );
        }
      },
    };

    return {
      module: BlobStorageModule,
      global: true,
      providers: [
        { provide: BLOB_STORAGE_CONFIG, useValue: config },
        adapterProvider,
        BlobStorageService,
      ],
      exports: [BlobStorageService, BLOB_STORAGE_ADAPTER],
    };
  }
}
