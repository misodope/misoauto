import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PostStatus } from '@backend/generated/prisma/client';
import { SOCIAL_ACCOUNT_PUBLIC_SELECT } from '@backend/social-accounts/repository/social-account-reader';

export type VideoPostWithRelations = Prisma.VideoPostGetPayload<{
  include: {
    video: true;
    platform: true;
    socialAccount: { select: typeof SOCIAL_ACCOUNT_PUBLIC_SELECT };
  };
}>;

export const VIDEO_POST_INCLUDE = {
  video: true,
  platform: true,
  socialAccount: { select: SOCIAL_ACCOUNT_PUBLIC_SELECT },
} as const;

@Injectable()
export class VideoPostReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VideoPostWhereUniqueInput;
    where?: Prisma.VideoPostWhereInput;
    orderBy?: Prisma.VideoPostOrderByWithRelationInput;
  }): Promise<VideoPostWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.videoPost.findMany({
      skip,
      take,
      cursor,
      where: { ...where, deletedAt: null },
      orderBy,
      include: VIDEO_POST_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.VideoPostWhereUniqueInput,
  ): Promise<VideoPostWithRelations | null> {
    return this.prisma.videoPost.findFirst({
      where: { ...where, deletedAt: null },
      include: VIDEO_POST_INCLUDE,
    });
  }

  async findByVideoId(videoId: number): Promise<VideoPostWithRelations[]> {
    return this.prisma.videoPost.findMany({
      where: { videoId, deletedAt: null },
      include: VIDEO_POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVideoAndAccounts(
    videoId: number,
    socialAccountIds: number[],
  ): Promise<VideoPostWithRelations[]> {
    return this.prisma.videoPost.findMany({
      where: {
        videoId,
        socialAccountId: { in: socialAccountIds },
        deletedAt: null,
      },
      include: VIDEO_POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformId(
    platformId: number,
  ): Promise<VideoPostWithRelations[]> {
    return this.prisma.videoPost.findMany({
      where: { platformId, deletedAt: null },
      include: VIDEO_POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySocialAccountId(
    socialAccountId: number,
  ): Promise<VideoPostWithRelations[]> {
    return this.prisma.videoPost.findMany({
      where: { socialAccountId, deletedAt: null },
      include: VIDEO_POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: PostStatus): Promise<VideoPostWithRelations[]> {
    return this.prisma.videoPost.findMany({
      where: { status, deletedAt: null },
      include: VIDEO_POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findScheduledPosts(before?: Date): Promise<VideoPostWithRelations[]> {
    const scheduledBefore = before || new Date();
    return this.prisma.videoPost.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        deletedAt: null,
        scheduledFor: {
          lte: scheduledBefore,
        },
      },
      include: VIDEO_POST_INCLUDE,
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async findPendingPosts(): Promise<VideoPostWithRelations[]> {
    return this.prisma.videoPost.findMany({
      where: {
        status: PostStatus.PENDING,
        deletedAt: null,
      },
      include: VIDEO_POST_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async count(where?: Prisma.VideoPostWhereInput): Promise<number> {
    return this.prisma.videoPost.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(where: Prisma.VideoPostWhereInput): Promise<boolean> {
    const count = await this.prisma.videoPost.count({
      where: { ...where, deletedAt: null },
    });
    return count > 0;
  }

  async findByPlatformPostId(
    platformPostId: string,
  ): Promise<VideoPostWithRelations | null> {
    return this.prisma.videoPost.findFirst({
      where: { platformPostId, deletedAt: null },
      include: VIDEO_POST_INCLUDE,
    });
  }
}
