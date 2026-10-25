import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoPostReader } from '@backend/video-posts/repository/video-post-reader';
import { VideoPostWriter } from '@backend/video-posts/repository/video-post-writer';
import { PostStatus } from '@backend/generated/prisma/client';

@Injectable()
export class ScheduledPostsCron {
  private readonly logger = new Logger(ScheduledPostsCron.name);

  constructor(
    private readonly videoPostReader: VideoPostReader,
    private readonly videoPostWriter: VideoPostWriter,
  ) {}

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
          if (post.socialAccount.deletedAt) {
            await this.videoPostWriter.updateIfStatus({
              id: post.id,
              allowedStatuses: [PostStatus.SCHEDULED],
              data: {
                status: PostStatus.CANCELLED,
                scheduledFor: null,
                cancellationReason: 'ACCOUNT_DISCONNECTED',
              },
            });
            continue;
          }

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
