import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoPostReader } from '@backend/video-posts/repository/video-post-reader';
import { JobsService } from '@backend/jobs/jobs.service';

@Injectable()
export class ScheduledPostsCron {
  private readonly logger = new Logger(ScheduledPostsCron.name);

  constructor(
    private readonly videoPostReader: VideoPostReader,
    private readonly jobsService: JobsService,
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

        await this.jobsService.enqueuePublishVideoPostBulk(
          scheduledPosts.map((post) => ({ videoPostId: post.id })),
        );

        this.logger.log(
          `Enqueued ${scheduledPosts.length} publish jobs`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to process scheduled posts', error);
    }
  }
}
