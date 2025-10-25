import { Module } from '@nestjs/common';
import { VideoReader } from './repository/videoReader';
import { VideoWriter } from './repository/videoWriter';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VideoReader, VideoWriter],
  exports: [VideoReader, VideoWriter],
})
export class VideoModule {}