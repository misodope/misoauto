import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VideoPostReader } from '@backend/video-post/repository/video-post-reader';
import { VideoPostWriter } from '@backend/video-post/repository/video-post-writer';
import { PostStatus } from '@prisma/client';

@Injectable()
export class FailedPostsCleanupCron {
  private readonly logger = new Logger(FailedPostsCleanupCron.name);

  constructor(
    private readonly videoPostReader: VideoPostReader,
    private readonly videoPostWriter: VideoPostWriter,
  ) {}

  /**
   * Clean up old failed posts
   * Runs every Sunday at midnight
   * Deletes failed posts older than 30 days
   */
  @Cron('0 0 * * 0', {
    name: 'cleanup-failed-posts',
  })
  async handleFailedPostsCleanup() {
    this.logger.log('Running failed posts cleanup');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const failedPosts = await this.videoPostReader.findAll({
        where: {
          status: PostStatus.FAILED,
          updatedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });
      
      this.logger.log(`Found ${failedPosts.length} old failed posts to delete`);

      // Delete each failed post
      let deletedCount = 0;
      for (const post of failedPosts) {
        try {
          await this.videoPostWriter.delete({ id: post.id });
          deletedCount++;
          this.logger.debug(`Deleted failed post ${post.id}`);
        } catch (error) {
          this.logger.error(`Failed to delete post ${post.id}`, error);
        }
      }

      this.logger.log(`Successfully deleted ${deletedCount} out of ${failedPosts.length} failed posts`);
    } catch (error) {
      this.logger.error('Failed to cleanup old posts', error);
    }
  }
}
