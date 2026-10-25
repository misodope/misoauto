import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DataDeletionRequest } from '@backend/generated/prisma/client';

@Injectable()
export class DataDeletionRequestReader {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string): Promise<DataDeletionRequest | null> {
    return this.prisma.dataDeletionRequest.findUnique({
      where: { confirmationCode: code },
    });
  }
}
