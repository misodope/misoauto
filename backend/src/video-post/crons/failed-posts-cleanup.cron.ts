import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VideoPostWriter } from '@backend/video-post/repository/video-post-writer';
import { PostStatus } from '@prisma/client';

@Injectable()
export class FailedPostsCleanupCron {
  private readonly logger = new Logger(FailedPostsCleanupCron.name);

  constructor(
    private readonly videoPostWriter: VideoPostWriter,
  ) {}

  /**
   * Automatically removes failed posts that haven't been updated in 30+ days
   * to prevent database bloat from accumulating permanent failures.
   *
   * Schedule: Daily at midnight
   */
  @Cron('0 0 * * *', {
    name: 'cleanup-failed-posts',
  })
  async handleFailedPostsCleanup() {
    this.logger.log('Running failed posts cleanup');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await this.videoPostWriter.deleteMany({
        status: PostStatus.FAILED,
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      });

      this.logger.log(`Successfully deleted ${deletedCount} old failed posts`);
    } catch (error) {
      this.logger.error('Failed to cleanup old posts', error);
    }
  }
}
