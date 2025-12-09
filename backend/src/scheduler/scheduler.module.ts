import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { TokenRefreshCron } from './crons/token-refresh.cron';
import { ScheduledPostsCron } from './crons/scheduled-posts.cron';
import { FailedPostsCleanupCron } from './crons/failed-posts-cleanup.cron';
import { SocialAccountModule } from '@backend/social-account/social-account.module';
import { VideoPostModule } from '@backend/video-post/video-post.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SocialAccountModule,
    VideoPostModule,
  ],
  providers: [
    SchedulerService,
    TokenRefreshCron,
    ScheduledPostsCron,
    FailedPostsCleanupCron,
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
