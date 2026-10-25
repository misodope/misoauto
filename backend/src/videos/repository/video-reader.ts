import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, VideoStatus } from '@backend/generated/prisma/client';

export type VideoWithRelations = Prisma.VideoGetPayload<{
  include: { user: true; posts: { include: { platform: true }; drafts: true } };
}>;

const VIDEO_INCLUDE = {
  user: true,
  drafts: { where: { deletedAt: null } },
  posts: {
    where: { deletedAt: null },
    include: {
      platform: true,
    },
  },
} as const;

@Injectable()
export class VideoReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VideoWhereUniqueInput;
    where?: Prisma.VideoWhereInput;
    orderBy?: Prisma.VideoOrderByWithRelationInput;
  }): Promise<VideoWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.video.findMany({
      skip,
      take,
      cursor,
      where: { ...where, deletedAt: null },
      orderBy,
      include: VIDEO_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.VideoWhereUniqueInput,
  ): Promise<VideoWithRelations | null> {
    return this.prisma.video.findFirst({
      where: { ...where, deletedAt: null },
      include: VIDEO_INCLUDE,
    });
  }

  async findByUserId(userId: number): Promise<VideoWithRelations[]> {
    return this.prisma.video.findMany({
      where: { userId, deletedAt: null },
      include: VIDEO_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: VideoStatus): Promise<VideoWithRelations[]> {
    return this.prisma.video.findMany({
      where: { status, deletedAt: null },
      include: VIDEO_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where?: Prisma.VideoWhereInput): Promise<number> {
    return this.prisma.video.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(where: Prisma.VideoWhereInput): Promise<boolean> {
    const count = await this.prisma.video.count({
      where: { ...where, deletedAt: null },
    });
    return count > 0;
  }

  async findByS3Key(s3Key: string): Promise<VideoWithRelations | null> {
    return this.prisma.video.findFirst({
      where: { s3Key, deletedAt: null },
      include: VIDEO_INCLUDE,
    });
  }
}
