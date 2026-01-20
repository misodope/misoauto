import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Platform, Prisma, PlatformType } from '@prisma/client';

@Injectable()
export class PlatformReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlatformWhereUniqueInput;
    where?: Prisma.PlatformWhereInput;
    orderBy?: Prisma.PlatformOrderByWithRelationInput;
  }): Promise<Platform[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.platform.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        accounts: true,
        posts: true,
      },
    });
  }

  async findOne(
    where: Prisma.PlatformWhereUniqueInput,
  ): Promise<Platform | null> {
    return this.prisma.platform.findUnique({
      where,
      include: {
        accounts: true,
        posts: true,
      },
    });
  }

  async findByName(name: PlatformType): Promise<Platform | null> {
    return this.prisma.platform.findUnique({
      where: { name },
      include: {
        accounts: true,
        posts: true,
      },
    });
  }

  async findActive(): Promise<Platform[]> {
    return this.prisma.platform.findMany({
      where: { isActive: true },
      include: {
        accounts: true,
        posts: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async count(where?: Prisma.PlatformWhereInput): Promise<number> {
    return this.prisma.platform.count({ where });
  }

  async exists(where: Prisma.PlatformWhereInput): Promise<boolean> {
    const count = await this.prisma.platform.count({ where });
    return count > 0;
  }
}
