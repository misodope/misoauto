import { Module } from '@nestjs/common';
import { VideoPostReader } from './repository/video-post-reader';
import { VideoPostWriter } from './repository/video-post-writer';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VideoPostReader, VideoPostWriter],
  exports: [VideoPostReader, VideoPostWriter],
})
export class VideoPostsModule {}
