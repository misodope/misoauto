import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DataDeletionService } from '../services/data-deletion.service';

const CONFIRMATION_CODE_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

@Controller('data-deletion')
export class DataDeletionController {
  constructor(private readonly dataDeletionService: DataDeletionService) {}

  @Get(':code')
  async getStatus(@Param('code') code: string) {
    if (!CONFIRMATION_CODE_PATTERN.test(code)) {
      throw new BadRequestException('Invalid confirmation code');
    }

    const request = await this.dataDeletionService.findByCode(code);
    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    return {
      confirmationCode: request.confirmationCode,
      platform: request.platform,
      status: request.status,
      dataFound: request.dataFound,
      requestedAt: request.requestedAt,
      completedAt: request.completedAt,
    };
  }
}
