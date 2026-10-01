import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from '@backend/system/queue';
import { VideoPostReader } from '@backend/video-posts/repository/video-post-reader';
import { VideoPostWriter } from '@backend/video-posts/repository/video-post-writer';
import { PlatformConnectTikTokService } from '@backend/platform/services/platform-connect-tiktok.service';
import { PostStatus, PlatformType } from '@backend/generated/prisma/client';
import { QUEUE_NAMES } from '../jobs.constants';
import {
  PublishVideoPostJobData,
  PublishVideoPostJobResult,
} from '../jobs.types';

@Injectable()
export class VideoPostProcessor implements OnModuleInit {
  private readonly logger = new Logger(VideoPostProcessor.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly videoPostReader: VideoPostReader,
    private readonly videoPostWriter: VideoPostWriter,
    private readonly tiktokService: PlatformConnectTikTokService,
  ) {}

  onModuleInit() {
    this.queueService.createWorker<
      PublishVideoPostJobData,
      PublishVideoPostJobResult
    >(QUEUE_NAMES.VIDEO_POST, (job) => this.process(job));

    this.logger.log('VideoPostProcessor worker registered');
  }

  async process(
    job: Job<PublishVideoPostJobData, PublishVideoPostJobResult>,
  ): Promise<PublishVideoPostJobResult> {
    const { videoPostId } = job.data;
    this.logger.log(`Processing publish job for video post ${videoPostId}`);

    const post = await this.videoPostReader.findOne({ id: videoPostId });

    if (!post) {
      this.logger.error(`Video post ${videoPostId} not found`);
      return { success: false, error: `Video post ${videoPostId} not found` };
    }

    if (
      post.status === PostStatus.PUBLISHED ||
      post.status === PostStatus.PUBLISHING
    ) {
      this.logger.warn(
        `Video post ${videoPostId} is already ${post.status}, skipping`,
      );
      return { success: false, error: `Post is already ${post.status}` };
    }

    await this.videoPostWriter.updateStatus(videoPostId, PostStatus.PUBLISHING);

    try {
      const result = await this.publishToplatform(post);

      await this.videoPostWriter.updatePostDetails({
        id: videoPostId,
        platformPostId: result.platformPostId,
        postUrl: result.postUrl,
        status: PostStatus.PUBLISHED,
      });

      this.logger.log(`Video post ${videoPostId} published successfully`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to publish video post ${videoPostId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      await this.videoPostWriter.updateStatus(videoPostId, PostStatus.FAILED);

      return { success: false, error: errorMessage };
    }
  }

  private async publishToplatform(
    post: Awaited<ReturnType<VideoPostReader['findOne']>>,
  ): Promise<PublishVideoPostJobResult> {
    if (!post) {
      throw new Error('Post not found');
    }

    const platformName = post.platform.name as PlatformType;

    switch (platformName) {
      case PlatformType.TIKTOK:
        return this.publishToTikTok(post);

      case PlatformType.YOUTUBE:
      case PlatformType.INSTAGRAM:
      case PlatformType.FACEBOOK:
        this.logger.warn(
          `Publishing to ${platformName} is not yet implemented`,
        );
        throw new Error(
          `Publishing to ${platformName} is not yet implemented`,
        );

      default:
        throw new Error(`Unknown platform: ${platformName}`);
    }
  }

  private async publishToTikTok(
    post: NonNullable<Awaited<ReturnType<VideoPostReader['findOne']>>>,
  ): Promise<PublishVideoPostJobResult> {
    this.logger.log(
      `Publishing video post ${post.id} to TikTok for social account ${post.socialAccountId}`,
    );

    const accessToken = post.socialAccount.accessToken;
    const videoUrl = post.video.s3Key;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    const publishResponse = await this.tiktokService.initializeVideoUploadDraft(
      accessToken,
      videoUrl,
      post.videoId,
    );

    return {
      success: true,
      platformPostId: publishResponse.publish_id,
    };
  }
}
