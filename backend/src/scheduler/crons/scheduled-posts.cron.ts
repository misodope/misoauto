import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoPostReader } from '@backend/video-post/repository/video-post-reader';

@Injectable()
export class ScheduledPostsCron {
  private readonly logger = new Logger(ScheduledPostsCron.name);

  constructor(private readonly videoPostReader: VideoPostReader) {}

  /**
   * Check for scheduled posts that are ready to publish
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'check-scheduled-posts',
  })
  async handleScheduledPosts() {
    this.logger.debug('Checking for scheduled posts');

    try {
      const scheduledPosts = await this.videoPostReader.findScheduledPosts(
        new Date(),
      );

      if (scheduledPosts.length > 0) {
        this.logger.log(
          `Found ${scheduledPosts.length} posts ready to publish`,
        );

        for (const post of scheduledPosts) {
          this.logger.log(
            `Publishing post ${post.id} to platform ${post.platformId}`,
          );
          // TODO: Implement platform-specific publishing logic
          // This will depend on the platform and video details
        }
      }
    } catch (error) {
      this.logger.error('Failed to process scheduled posts', error);
    }
  }
}
