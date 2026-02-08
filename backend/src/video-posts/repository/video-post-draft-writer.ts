import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { VideoPostDraft, Prisma } from '@prisma/client';

@Injectable()
export class VideoPostDraftWriter {
  constructor(private prisma: PrismaService) {}

  async create(
    data: Prisma.VideoPostDraftCreateInput,
  ): Promise<VideoPostDraft> {
    return this.prisma.videoPostDraft.create({
      data,
      include: {
        video: true,
      },
    });
  }

  async update(params: {
    where: Prisma.VideoPostDraftWhereUniqueInput;
    data: Prisma.VideoPostDraftUpdateInput;
  }): Promise<VideoPostDraft> {
    const { where, data } = params;
    return this.prisma.videoPostDraft.update({
      data,
      where,
      include: {
        video: true,
      },
    });
  }

  async markUploadCompleted(id: number): Promise<VideoPostDraft> {
    return this.prisma.videoPostDraft.update({
      where: { id },
      data: { uploadCompletedAt: new Date() },
      include: {
        video: true,
      },
    });
  }

  async delete(
    where: Prisma.VideoPostDraftWhereUniqueInput,
  ): Promise<VideoPostDraft> {
    return this.prisma.videoPostDraft.delete({
      where,
    });
  }

  async deleteMany(where: Prisma.VideoPostDraftWhereInput): Promise<number> {
    const result = await this.prisma.videoPostDraft.deleteMany({ where });
    return result.count;
  }
}
