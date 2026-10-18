import { randomUUID } from 'node:crypto';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  PostStatus,
  VideoStatus,
} from '@backend/generated/prisma/client';
import {
  VideoPostReader,
  VideoPostWithRelations,
} from '../repository/video-post-reader';
import { VideoPostWriter } from '../repository/video-post-writer';
import { VideoReader } from '@backend/videos/repository/video-reader';
import { SocialAccountReader } from '@backend/social-accounts/repository/social-account-reader';
import { CreateVideoPostDto } from '../dto/create-video-post.dto';
import { ScheduleVideoPostDto } from '../dto/schedule-video-post.dto';
import { CreateVideoPostBatchDto } from '../dto/create-video-post-batch.dto';
import { UpdateVideoPostDetailsDto } from '../dto/update-video-post-details.dto';
import {
  NormalizedVideoPostDetails,
  VideoPostDetailsService,
} from './video-post-details.service';

export interface VideoPostBatchResult {
  batchId: string;
  posts: VideoPostWithRelations[];
}

/** Statuses that block creating another post for the same video + account. */
const ACTIVE_POST_STATUSES: PostStatus[] = [
  PostStatus.SCHEDULED,
  PostStatus.PUBLISHING,
];

@Injectable()
export class VideoPostsService {
  private readonly logger = new Logger(VideoPostsService.name);

  constructor(
    private readonly videoPostReader: VideoPostReader,
    private readonly videoPostWriter: VideoPostWriter,
    private readonly videoReader: VideoReader,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly videoPostDetailsService: VideoPostDetailsService,
  ) {}

  async create(
    userId: number,
    dto: CreateVideoPostDto,
  ): Promise<VideoPostWithRelations> {
    // Verify video exists and belongs to user
    const video = await this.videoReader.findOne({ id: dto.videoId });
    if (!video || video.userId !== userId) {
      throw new NotFoundException('Video not found');
    }

    if (video.status !== VideoStatus.READY) {
      throw new BadRequestException('Video is not ready for posting');
    }

    // Verify social account exists and belongs to user
    const socialAccount = await this.socialAccountReader.findOne({
      id: dto.socialAccountId,
    });
    if (!socialAccount || socialAccount.userId !== userId) {
      throw new NotFoundException('Social account not found');
    }

    // Determine initial status
    const isScheduled =
      dto.scheduledFor && new Date(dto.scheduledFor) > new Date();
    const status = isScheduled ? PostStatus.SCHEDULED : PostStatus.PENDING;

    const videoPost = await this.videoPostWriter.create({
      video: { connect: { id: dto.videoId } },
      platform: { connect: { id: socialAccount.platformId } },
      socialAccount: { connect: { id: dto.socialAccountId } },
      status,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
    });

    return videoPost as VideoPostWithRelations;
  }

  /**
   * Schedules a video on several accounts at once. Every target is validated
   * first; if any fails, nothing is written and all messages are returned.
   * An unscheduled (PENDING) post for the same account is reused.
   */
  async createBatch(
    userId: number,
    dto: CreateVideoPostBatchDto,
  ): Promise<VideoPostBatchResult> {
    const video = await this.videoReader.findOne({ id: dto.videoId });
    if (!video || video.userId !== userId) {
      throw new NotFoundException('Video not found');
    }
    if (video.status !== VideoStatus.READY) {
      throw new BadRequestException('Video is not ready for posting');
    }

    const scheduledFor = new Date(dto.scheduledFor);
    if (scheduledFor <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const accountIds = dto.targets.map((target) => target.socialAccountId);
    if (new Set(accountIds).size !== accountIds.length) {
      throw new BadRequestException('Each account can only appear once');
    }

    const accounts = await this.socialAccountReader.findManyByIdsForUser(
      userId,
      accountIds,
    );
    const accountsById = new Map(accounts.map((a) => [a.id, a]));
    if (accountIds.some((id) => !accountsById.has(id))) {
      throw new NotFoundException('Social account not found');
    }

    const existingPosts = await this.videoPostReader.findByVideoAndAccounts(
      video.id,
      accountIds,
    );

    const batchId = randomUUID();
    const errors: string[] = [];
    const creates: Prisma.VideoPostCreateInput[] = [];
    const updates: { id: number; data: Prisma.VideoPostUpdateInput }[] = [];

    for (const target of dto.targets) {
      const account = accountsById.get(target.socialAccountId)!;
      const label = `@${account.username} (${account.platform.displayName})`;
      const { details, errors: detailErrors } =
        this.videoPostDetailsService.normalize(
          account.platform.name,
          target,
          video,
        );
      errors.push(...detailErrors.map((message) => `${label}: ${message}`));

      // existingPosts is newest first
      const accountPosts = existingPosts.filter(
        (post) => post.socialAccountId === account.id,
      );
      if (
        accountPosts.some((post) => ACTIVE_POST_STATUSES.includes(post.status))
      ) {
        errors.push(`${label}: Already scheduled or publishing`);
        continue;
      }

      const data = {
        ...this.toDetailsData(details),
        status: PostStatus.SCHEDULED,
        scheduledFor,
        batchId,
      };
      const unscheduled = accountPosts.find(
        (post) => post.status === PostStatus.PENDING,
      );
      if (unscheduled) {
        updates.push({ id: unscheduled.id, data });
      } else {
        creates.push({
          ...data,
          video: { connect: { id: video.id } },
          platform: { connect: { id: account.platformId } },
          socialAccount: { connect: { id: account.id } },
        });
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const posts = await this.videoPostWriter.saveBatch({ creates, updates });
    this.logger.log(
      `Created batch ${batchId} with ${posts.length} posts for video ${video.id}`,
    );
    return { batchId, posts };
  }

  async updateDetails(
    userId: number,
    postId: number,
    dto: UpdateVideoPostDetailsDto,
  ): Promise<VideoPostWithRelations> {
    const post = await this.findOneForUser(userId, postId);

    const { details, errors } = this.videoPostDetailsService.normalize(
      post.platform.name,
      {
        uploadMode: dto.uploadMode ?? post.uploadMode,
        title: dto.title ?? post.title,
        caption: dto.caption ?? post.caption,
        options: dto.options ?? this.toOptionsRecord(post.options),
      },
      post.video,
    );
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const updated = await this.videoPostWriter.updateIfStatus({
      id: postId,
      allowedStatuses: [PostStatus.PENDING, PostStatus.SCHEDULED],
      data: this.toDetailsData(details),
    });
    if (updated === 0) {
      throw new BadRequestException('Post can no longer be edited');
    }

    return this.findOneForUser(userId, postId);
  }

  async schedule(
    userId: number,
    postId: number,
    dto: ScheduleVideoPostDto,
  ): Promise<VideoPostWithRelations> {
    await this.findOneForUser(userId, postId);

    const scheduledFor = new Date(dto.scheduledFor);
    if (scheduledFor <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const updated = await this.videoPostWriter.updateIfStatus({
      id: postId,
      allowedStatuses: [
        PostStatus.PENDING,
        PostStatus.SCHEDULED,
        PostStatus.FAILED,
      ],
      data: { status: PostStatus.SCHEDULED, scheduledFor },
    });
    if (updated === 0) {
      throw new BadRequestException('Post can no longer be scheduled');
    }

    return this.findOneForUser(userId, postId);
  }

  async cancelSchedule(
    userId: number,
    postId: number,
  ): Promise<VideoPostWithRelations> {
    await this.findOneForUser(userId, postId);

    const updated = await this.videoPostWriter.updateIfStatus({
      id: postId,
      allowedStatuses: [PostStatus.SCHEDULED],
      data: { status: PostStatus.PENDING, scheduledFor: null },
    });
    if (updated === 0) {
      throw new BadRequestException('Post is not scheduled');
    }

    return this.findOneForUser(userId, postId);
  }

  async findAllForUser(userId: number): Promise<VideoPostWithRelations[]> {
    const posts = await this.videoPostReader.findAll({
      where: {
        video: { userId },
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts;
  }

  async findByVideoId(
    userId: number,
    videoId: number,
  ): Promise<VideoPostWithRelations[]> {
    // Verify video belongs to user
    const video = await this.videoReader.findOne({ id: videoId });
    if (!video || video.userId !== userId) {
      throw new NotFoundException('Video not found');
    }

    return this.videoPostReader.findByVideoId(videoId);
  }

  async findOne(
    userId: number,
    postId: number,
  ): Promise<VideoPostWithRelations> {
    return this.findOneForUser(userId, postId);
  }

  async delete(userId: number, postId: number): Promise<void> {
    const post = await this.findOneForUser(userId, postId);

    if (post.status === PostStatus.PUBLISHING) {
      throw new BadRequestException(
        'Cannot delete a post that is being published',
      );
    }

    await this.videoPostWriter.delete({ id: postId });
  }

  private toDetailsData(details: NormalizedVideoPostDetails) {
    return {
      uploadMode: details.uploadMode,
      title: details.title,
      caption: details.caption,
      options: details.options as Prisma.InputJsonObject,
    };
  }

  private toOptionsRecord(
    options: Prisma.JsonValue | null,
  ): Record<string, unknown> | null {
    return options && typeof options === 'object' && !Array.isArray(options)
      ? (options as Record<string, unknown>)
      : null;
  }

  private async findOneForUser(
    userId: number,
    postId: number,
  ): Promise<VideoPostWithRelations> {
    const post = await this.videoPostReader.findOne({ id: postId });

    if (!post) {
      throw new NotFoundException('Video post not found');
    }

    if (post.video.userId !== userId) {
      throw new NotFoundException('Video post not found');
    }

    return post;
  }
}
