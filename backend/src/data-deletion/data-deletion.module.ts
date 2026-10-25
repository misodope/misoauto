import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { DataDeletionController } from './controllers/data-deletion.controller';
import { DataDeletionRequestReader } from './repository/data-deletion-request-reader';
import { DataDeletionRequestWriter } from './repository/data-deletion-request-writer';
import { DataDeletionService } from './services/data-deletion.service';

@Module({
  imports: [PrismaModule],
  controllers: [DataDeletionController],
  providers: [
    DataDeletionRequestReader,
    DataDeletionRequestWriter,
    DataDeletionService,
  ],
  exports: [DataDeletionService],
})
export class DataDeletionModule {}
