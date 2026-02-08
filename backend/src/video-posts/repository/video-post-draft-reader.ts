import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export type VideoPostDraftWithRelations = Prisma.VideoPostDraftGetPayload<{
  include: { video: true };
}>;

const VIDEO_POST_DRAFT_INCLUDE = {
  video: true,
} as const;

@Injectable()
export class VideoPostDraftReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VideoPostDraftWhereUniqueInput;
    where?: Prisma.VideoPostDraftWhereInput;
    orderBy?: Prisma.VideoPostDraftOrderByWithRelationInput;
  }): Promise<VideoPostDraftWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.videoPostDraft.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: VIDEO_POST_DRAFT_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.VideoPostDraftWhereUniqueInput,
  ): Promise<VideoPostDraftWithRelations | null> {
    return this.prisma.videoPostDraft.findUnique({
      where,
      include: VIDEO_POST_DRAFT_INCLUDE,
    });
  }

  async findByVideoId(videoId: number): Promise<VideoPostDraftWithRelations[]> {
    return this.prisma.videoPostDraft.findMany({
      where: { videoId },
      include: VIDEO_POST_DRAFT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformVideoId(
    platformVideoId: string,
  ): Promise<VideoPostDraftWithRelations | null> {
    return this.prisma.videoPostDraft.findFirst({
      where: { platformVideoId },
      include: VIDEO_POST_DRAFT_INCLUDE,
    });
  }

  async findPending(): Promise<VideoPostDraftWithRelations[]> {
    return this.prisma.videoPostDraft.findMany({
      where: { uploadCompletedAt: null },
      include: VIDEO_POST_DRAFT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async count(where?: Prisma.VideoPostDraftWhereInput): Promise<number> {
    return this.prisma.videoPostDraft.count({ where });
  }

  async exists(where: Prisma.VideoPostDraftWhereInput): Promise<boolean> {
    const count = await this.prisma.videoPostDraft.count({ where });
    return count > 0;
  }
}
