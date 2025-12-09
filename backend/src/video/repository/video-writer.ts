import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Video, Prisma, VideoStatus } from '@prisma/client';

@Injectable()
export class VideoWriter {
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
}