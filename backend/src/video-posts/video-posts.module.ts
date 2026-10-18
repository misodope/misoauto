import { Module } from '@nestjs/common';
import { VideoPostReader } from './repository/video-post-reader';
import { VideoPostWriter } from './repository/video-post-writer';
import { VideoPostDraftReader } from './repository/video-post-draft-reader';
import { VideoPostDraftWriter } from './repository/video-post-draft-writer';
import { VideoPostsService } from './services/video-posts.service';
import { VideoPostDetailsService } from './services/video-post-details.service';
import { VideoPostsController } from './controllers/video-posts.controller';
import { PrismaModule } from '../database/prisma.module';
import { VideosModule } from '../videos/videos.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, VideosModule, SocialAccountsModule, AuthModule],
  controllers: [VideoPostsController],
  providers: [
    VideoPostReader,
    VideoPostWriter,
    VideoPostDraftReader,
    VideoPostDraftWriter,
    VideoPostsService,
    VideoPostDetailsService,
  ],
  exports: [
    VideoPostReader,
    VideoPostWriter,
    VideoPostDraftReader,
    VideoPostDraftWriter,
    VideoPostsService,
    VideoPostDetailsService,
  ],
})
export class VideoPostsModule {}
