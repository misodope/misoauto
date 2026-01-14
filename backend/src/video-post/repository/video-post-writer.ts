import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VideoPost, Prisma, PostStatus } from '@prisma/client';

@Injectable()
export class VideoPostWriter {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.VideoPostCreateInput): Promise<VideoPost> {
    return this.prisma.videoPost.create({
      data,
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
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
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
    });
  }

  async updateStatus(id: number, status: PostStatus): Promise<VideoPost> {
    return this.prisma.videoPost.update({
      where: { id },
      data: {
        status,
        ...(status === PostStatus.PUBLISHED && { postedAt: new Date() }),
      },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
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
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
    });
  }

  async schedulePost(id: number, scheduledFor: Date): Promise<VideoPost> {
    return this.prisma.videoPost.update({
      where: { id },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledFor,
      },
      include: {
        video: true,
        platform: true,
        socialAccount: true,
      },
    });
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