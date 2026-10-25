import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  DataDeletionRequest,
  DataDeletionSource,
  DataDeletionStatus,
  PlatformType,
} from '@backend/generated/prisma/client';

@Injectable()
export class DataDeletionRequestWriter {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    platform: PlatformType;
    source: DataDeletionSource;
  }): Promise<DataDeletionRequest> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.prisma.dataDeletionRequest.create({
          data: {
            confirmationCode: randomBytes(12).toString('base64url'),
            platform: params.platform,
            source: params.source,
          },
        });
      } catch (error) {
        if (attempt === 0 && (error as { code?: string })?.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to create a data deletion request');
  }

  async markCompleted(
    id: number,
    dataFound: boolean,
  ): Promise<DataDeletionRequest> {
    return this.prisma.dataDeletionRequest.update({
      where: { id },
      data: {
        status: DataDeletionStatus.COMPLETED,
        dataFound,
        completedAt: new Date(),
      },
    });
  }

  async markFailed(id: number): Promise<DataDeletionRequest> {
    return this.prisma.dataDeletionRequest.update({
      where: { id },
      data: { status: DataDeletionStatus.FAILED },
    });
  }
}
