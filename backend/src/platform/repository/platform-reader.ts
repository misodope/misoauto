import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PlatformType } from '@prisma/client';

export type PlatformWithRelations = Prisma.PlatformGetPayload<{
  include: { accounts: true; posts: true };
}>;

const PLATFORM_INCLUDE = {
  accounts: true,
  posts: true,
} as const;

@Injectable()
export class PlatformReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlatformWhereUniqueInput;
    where?: Prisma.PlatformWhereInput;
    orderBy?: Prisma.PlatformOrderByWithRelationInput;
  }): Promise<PlatformWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.platform.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: PLATFORM_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.PlatformWhereUniqueInput,
  ): Promise<PlatformWithRelations | null> {
    return this.prisma.platform.findUnique({
      where,
      include: PLATFORM_INCLUDE,
    });
  }

  async findByName(name: PlatformType): Promise<PlatformWithRelations | null> {
    return this.prisma.platform.findUnique({
      where: { name },
      include: PLATFORM_INCLUDE,
    });
  }

  async findActive(): Promise<PlatformWithRelations[]> {
    return this.prisma.platform.findMany({
      where: { isActive: true },
      include: PLATFORM_INCLUDE,
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
