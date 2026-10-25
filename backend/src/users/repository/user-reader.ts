import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@backend/generated/prisma/client';

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    socialAccounts: {
      select: {
        id: true;
        accountId: true;
        username: true;
        platform: { select: { id: true; name: true; displayName: true } };
      };
    };
    videos: true;
  };
}>;

const USER_INCLUDE = {
  socialAccounts: {
    where: { deletedAt: null },
    select: {
      id: true,
      accountId: true,
      username: true,
      platform: { select: { id: true, name: true, displayName: true } },
    },
  },
  videos: { where: { deletedAt: null } },
} as const;

@Injectable()
export class UserReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<UserWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where: { ...where, deletedAt: null },
      orderBy,
      include: USER_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithRelations | null> {
    return this.prisma.user.findFirst({
      where: { ...where, deletedAt: null },
      include: USER_INCLUDE,
    });
  }

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: USER_INCLUDE,
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(where: Prisma.UserWhereInput): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { ...where, deletedAt: null },
    });
    return count > 0;
  }
}
