import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Video, Prisma, VideoStatus } from '@prisma/client';

@Injectable()
export class VideoRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.VideoCreateInput): Promise<Video> {
    return this.prisma.video.create({
      data,
      include: {
        user: true,
        posts: true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VideoWhereUniqueInput;
    where?: Prisma.VideoWhereInput;
    orderBy?: Prisma.VideoOrderByWithRelationInput;
  }): Promise<Video[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.video.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        user: true,
        posts: true,
      },
    });
  }

  async findOne(where: Prisma.VideoWhereUniqueInput): Promise<Video | null> {
    return this.prisma.video.findUnique({
      where,
      include: {
        user: true,
        posts: true,
      },
    });
  }

  async findByUserId(userId: number): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: { userId },
      include: {
        user: true,
        posts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: VideoStatus): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: { status },
      include: {
        user: true,
        posts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(params: {
    where: Prisma.VideoWhereUniqueInput;
    data: Prisma.VideoUpdateInput;
  }): Promise<Video> {
    const { where, data } = params;
    return this.prisma.video.update({
      data,
      where,
      include: {
        user: true,
        posts: true,
      },
    });
  }

  async updateStatus(id: number, status: VideoStatus): Promise<Video> {
    return this.prisma.video.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        posts: true,
      },
    });
  }

  async delete(where: Prisma.VideoWhereUniqueInput): Promise<Video> {
    return this.prisma.video.delete({
      where,
    });
  }

  async count(where?: Prisma.VideoWhereInput): Promise<number> {
    return this.prisma.video.count({ where });
  }

  async exists(where: Prisma.VideoWhereInput): Promise<boolean> {
    const count = await this.prisma.video.count({ where });
    return count > 0;
  }

  async findByS3Key(s3Key: string): Promise<Video | null> {
    return this.prisma.video.findFirst({
      where: { s3Key },
      include: {
        user: true,
        posts: true,
      },
    });
  }
}
