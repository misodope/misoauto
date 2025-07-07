import { Module } from '@nestjs/common';
import { VideoRepository } from './video.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VideoRepository],
  exports: [VideoRepository],
})
export class VideoModule {}
