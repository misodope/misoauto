import { Injectable, Logger } from '@nestjs/common';
import {
  DataDeletionRequest,
  DataDeletionSource,
  PlatformType,
} from '@backend/generated/prisma/client';
import { DataDeletionRequestReader } from '../repository/data-deletion-request-reader';
import { DataDeletionRequestWriter } from '../repository/data-deletion-request-writer';

@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(
    private readonly writer: DataDeletionRequestWriter,
    private readonly reader: DataDeletionRequestReader,
  ) {}

  /** Records the request, runs the removal, and returns the confirmation code. */
  async handleRequest(params: {
    platform: PlatformType;
    source: DataDeletionSource;
    remove: () => Promise<boolean>;
  }): Promise<DataDeletionRequest> {
    const request = await this.writer.create({
      platform: params.platform,
      source: params.source,
    });

    try {
      const dataFound = await params.remove();
      return await this.writer.markCompleted(request.id, dataFound);
    } catch (error) {
      try {
        await this.writer.markFailed(request.id);
      } catch (markFailedError) {
        this.logger.error(
          `Failed to mark data deletion request ${request.id} as failed`,
          markFailedError instanceof Error ? markFailedError.stack : undefined,
        );
      }

      this.logger.error(
        `Data deletion request ${request.id} failed`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findByCode(code: string): Promise<DataDeletionRequest | null> {
    return this.reader.findByCode(code);
  }
}
