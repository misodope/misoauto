import { Module } from '@nestjs/common';
import { VideoPostReader } from './repository/videoPostReader';
import { VideoPostWriter } from './repository/videoPostWriter';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VideoPostReader, VideoPostWriter],
  exports: [VideoPostReader, VideoPostWriter],
})
export class VideoPostModule {}