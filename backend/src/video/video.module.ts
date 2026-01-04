import { Module } from '@nestjs/common';
import { VideoReader } from './repository/video-reader';
import { VideoWriter } from './repository/video-writer';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VideoReader, VideoWriter],
  exports: [VideoReader, VideoWriter],
})
export class VideoModule {}
