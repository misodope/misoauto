import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PlatformType } from '@backend/generated/prisma/client';

export type PlatformWithRelations = Prisma.PlatformGetPayload<{
  include: {
    accounts: {
      select: {
        id: true;
        userId: true;
        platformId: true;
        accountId: true;
        username: true;
        deletedAt: true;
        disconnectState: true;
      };
    };
    posts: true;
    drafts: true;
  };
}>;

const PLATFORM_INCLUDE = {
  accounts: {
    where: { deletedAt: null },
    select: {
      id: true,
      userId: true,
      platformId: true,
      accountId: true,
      username: true,
      deletedAt: true,
      disconnectState: true,
    },
  },
  posts: { where: { deletedAt: null } },
  drafts: { where: { deletedAt: null } },
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
    return this.prisma.platform.findFirst({
      where,
      include: PLATFORM_INCLUDE,
    });
  }

  async findByName(name: PlatformType): Promise<PlatformWithRelations | null> {
    return this.prisma.platform.findFirst({
      where: { name, isActive: true },
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
