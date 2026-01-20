import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Platform, Prisma } from '@prisma/client';

@Injectable()
export class PlatformWriter {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PlatformCreateInput): Promise<Platform> {
    return this.prisma.platform.create({
      data,
      include: {
        accounts: true,
        posts: true,
      },
    });
  }

  async update(params: {
    where: Prisma.PlatformWhereUniqueInput;
    data: Prisma.PlatformUpdateInput;
  }): Promise<Platform> {
    const { where, data } = params;
    return this.prisma.platform.update({
      data,
      where,
      include: {
        accounts: true,
        posts: true,
      },
    });
  }

  async updateStatus(id: number, isActive: boolean): Promise<Platform> {
    return this.prisma.platform.update({
      where: { id },
      data: { isActive },
      include: {
        accounts: true,
        posts: true,
      },
    });
  }

  async delete(where: Prisma.PlatformWhereUniqueInput): Promise<Platform> {
    return this.prisma.platform.delete({
      where,
    });
  }
}
