import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { VideoPostProcessor } from './processors/video-post.processor';
import { VideoPostsModule } from '@backend/video-posts/video-posts.module';
import { PlatformModule } from '@backend/platform/platform.module';

@Module({
  imports: [VideoPostsModule, PlatformModule],
  providers: [JobsService, VideoPostProcessor],
  exports: [JobsService],
})
export class JobsModule {}
