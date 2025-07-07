import { Module } from '@nestjs/common';
import { VideoPostRepository } from './video-post.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VideoPostRepository],
  exports: [VideoPostRepository],
})
export class VideoPostModule {}
