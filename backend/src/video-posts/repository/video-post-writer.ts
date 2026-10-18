import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  VideoPost,
  Prisma,
  PostStatus,
} from '@backend/generated/prisma/client';
import {
  VIDEO_POST_INCLUDE,
  VideoPostWithRelations,
} from './video-post-reader';

@Injectable()
export class VideoPostWriter {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.VideoPostCreateInput): Promise<VideoPost> {
    return this.prisma.videoPost.create({
      data,
      include: VIDEO_POST_INCLUDE,
    });
  }

  async update(params: {
    where: Prisma.VideoPostWhereUniqueInput;
    data: Prisma.VideoPostUpdateInput;
  }): Promise<VideoPost> {
    const { where, data } = params;
    return this.prisma.videoPost.update({
      data,
      where,
      include: VIDEO_POST_INCLUDE,
    });
  }

  async updateStatus(id: number, status: PostStatus): Promise<VideoPost> {
    return this.prisma.videoPost.update({
      where: { id },
      data: {
        status,
        ...(status === PostStatus.PUBLISHED && { postedAt: new Date() }),
      },
      include: VIDEO_POST_INCLUDE,
    });
  }

  async updatePostDetails(params: {
    id: number;
    platformPostId?: string;
    postUrl?: string;
    status?: PostStatus;
  }): Promise<VideoPost> {
    const { id, platformPostId, postUrl, status } = params;
    return this.prisma.videoPost.update({
      where: { id },
      data: {
        platformPostId,
        postUrl,
        status,
        ...(status === PostStatus.PUBLISHED && { postedAt: new Date() }),
      },
      include: VIDEO_POST_INCLUDE,
    });
  }

  /**
   * Updates the post only while it is in one of `allowedStatuses`.
   * Returns the number of rows changed (0 or 1) so callers can detect races.
   */
  async updateIfStatus(params: {
    id: number;
    allowedStatuses: PostStatus[];
    data: Prisma.VideoPostUpdateManyMutationInput;
  }): Promise<number> {
    const result = await this.prisma.videoPost.updateMany({
      where: { id: params.id, status: { in: params.allowedStatuses } },
      data: params.data,
    });
    return result.count;
  }

  /** Applies all updates and creates in one transaction. */
  async saveBatch(params: {
    creates: Prisma.VideoPostCreateInput[];
    updates: { id: number; data: Prisma.VideoPostUpdateInput }[];
  }): Promise<VideoPostWithRelations[]> {
    return this.prisma.$transaction([
      ...params.updates.map(({ id, data }) =>
        this.prisma.videoPost.update({
          where: { id },
          data,
          include: VIDEO_POST_INCLUDE,
        }),
      ),
      ...params.creates.map((data) =>
        this.prisma.videoPost.create({ data, include: VIDEO_POST_INCLUDE }),
      ),
    ]);
  }

  async delete(where: Prisma.VideoPostWhereUniqueInput): Promise<VideoPost> {
    return this.prisma.videoPost.delete({
      where,
    });
  }

  async deleteMany(where: Prisma.VideoPostWhereInput): Promise<number> {
    const result = await this.prisma.videoPost.deleteMany({ where });
    return result.count;
  }
}
