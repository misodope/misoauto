import { Injectable, NotFoundException } from '@nestjs/common';
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

  /**
   * Creates a post while holding the account row lock. This makes account
   * disconnect and post creation serialize instead of allowing a post to be
   * created after disconnect has cancelled the account's future work.
   */
  async createForActiveAccount(
    data: Prisma.VideoPostCreateInput,
    socialAccountId: number,
  ): Promise<VideoPost> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockActiveSocialAccounts(tx, [socialAccountId]);
      return tx.videoPost.create({
        data,
        include: VIDEO_POST_INCLUDE,
      });
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
      where: {
        id: params.id,
        deletedAt: null,
        status: { in: params.allowedStatuses },
      },
      data: params.data,
    });
    return result.count;
  }

  /** Applies all updates and creates in one transaction. */
  async saveBatch(params: {
    creates: Prisma.VideoPostCreateInput[];
    updates: { id: number; data: Prisma.VideoPostUpdateInput }[];
    activeSocialAccountIds: number[];
  }): Promise<VideoPostWithRelations[]> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockActiveSocialAccounts(tx, params.activeSocialAccountIds);

      return Promise.all([
        ...params.updates.map(({ id, data }) =>
          tx.videoPost.update({
            where: { id },
            data,
            include: VIDEO_POST_INCLUDE,
          }),
        ),
        ...params.creates.map((data) =>
          tx.videoPost.create({ data, include: VIDEO_POST_INCLUDE }),
        ),
      ]);
    });
  }

  async delete(where: Prisma.VideoPostWhereUniqueInput): Promise<VideoPost> {
    return this.prisma.videoPost.update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  async deleteMany(where: Prisma.VideoPostWhereInput): Promise<number> {
    const result = await this.prisma.videoPost.updateMany({
      where: { ...where, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }

  private async lockActiveSocialAccounts(
    tx: Prisma.TransactionClient,
    socialAccountIds: number[],
  ): Promise<void> {
    const uniqueIds = [...new Set(socialAccountIds)];
    if (uniqueIds.length === 0) {
      return;
    }

    const activeAccounts = await tx.$queryRaw<Array<{ id: number }>>(
      Prisma.sql`
        SELECT id
        FROM "social_accounts"
        WHERE id IN (${Prisma.join(uniqueIds)})
          AND deleted_at IS NULL
          AND disconnect_state = 'ACTIVE'
        FOR UPDATE
      `,
    );

    if (activeAccounts.length !== uniqueIds.length) {
      throw new NotFoundException('Social account not found');
    }
  }
}
