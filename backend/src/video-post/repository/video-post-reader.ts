import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VideoPost, Prisma, PostStatus } from '@prisma/client';

@Injectable()
export class VideoPostReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VideoPostWhereUniqueInput;
    where?: Prisma.VideoPostWhereInput;
    orderBy?: Prisma.VideoPostOrderByWithRelationInput;
  }): Promise<VideoPost[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.videoPost.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
    });
  }

  async findOne(
    where: Prisma.VideoPostWhereUniqueInput,
  ): Promise<VideoPost | null> {
    return this.prisma.videoPost.findUnique({
      where,
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
    });
  }

  async findByVideoId(videoId: number): Promise<VideoPost[]> {
    return this.prisma.videoPost.findMany({
      where: { videoId },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformId(platformId: number): Promise<VideoPost[]> {
    return this.prisma.videoPost.findMany({
      where: { platformId },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySocialAccountId(socialAccountId: number): Promise<VideoPost[]> {
    return this.prisma.videoPost.findMany({
      where: { socialAccountId },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: PostStatus): Promise<VideoPost[]> {
    return this.prisma.videoPost.findMany({
      where: { status },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findScheduledPosts(before?: Date): Promise<VideoPost[]> {
    const scheduledBefore = before || new Date();
    return this.prisma.videoPost.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledFor: {
          lte: scheduledBefore,
        },
      },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async findPendingPosts(): Promise<VideoPost[]> {
    return this.prisma.videoPost.findMany({
      where: {
        status: PostStatus.PENDING,
      },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async count(where?: Prisma.VideoPostWhereInput): Promise<number> {
    return this.prisma.videoPost.count({ where });
  }

  async exists(where: Prisma.VideoPostWhereInput): Promise<boolean> {
    const count = await this.prisma.videoPost.count({ where });
    return count > 0;
  }

  async findByPlatformPostId(
    platformPostId: string,
  ): Promise<VideoPost | null> {
    return this.prisma.videoPost.findFirst({
      where: { platformPostId },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
    });
  }
}
