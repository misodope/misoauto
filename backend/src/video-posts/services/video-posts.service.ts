import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PostStatus, VideoStatus } from '@prisma/client';
import {
  VideoPostReader,
  VideoPostWithRelations,
} from '../repository/video-post-reader';
import { VideoPostWriter } from '../repository/video-post-writer';
import { VideoReader } from '@backend/videos/repository/video-reader';
import { SocialAccountReader } from '@backend/social-accounts/repository/social-account-reader';
import { CreateVideoPostDto } from '../dto/create-video-post.dto';
import { ScheduleVideoPostDto } from '../dto/schedule-video-post.dto';

@Injectable()
export class VideoPostsService {
  constructor(
    private readonly videoPostReader: VideoPostReader,
    private readonly videoPostWriter: VideoPostWriter,
    private readonly videoReader: VideoReader,
    private readonly socialAccountReader: SocialAccountReader,
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

  async schedule(
    userId: number,
    postId: number,
    dto: ScheduleVideoPostDto,
  ): Promise<VideoPostWithRelations> {
    const post = await this.findOneForUser(userId, postId);

    if (post.status === PostStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot schedule an already published post',
      );
    }

    if (post.status === PostStatus.PUBLISHING) {
      throw new BadRequestException(
        'Cannot schedule a post that is being published',
      );
    }

    const scheduledFor = new Date(dto.scheduledFor);
    if (scheduledFor <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const updated = await this.videoPostWriter.schedulePost(
      postId,
      scheduledFor,
    );
    return updated as VideoPostWithRelations;
  }

  async cancelSchedule(
    userId: number,
    postId: number,
  ): Promise<VideoPostWithRelations> {
    const post = await this.findOneForUser(userId, postId);

    if (post.status !== PostStatus.SCHEDULED) {
      throw new BadRequestException('Post is not scheduled');
    }

    const updated = await this.videoPostWriter.update({
      where: { id: postId },
      data: {
        status: PostStatus.PENDING,
        scheduledFor: null,
      },
    });

    return updated as VideoPostWithRelations;
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
