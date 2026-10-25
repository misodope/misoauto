import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@backend/generated/prisma/client';

export type SocialAccountWithRelations = Prisma.SocialAccountGetPayload<{
  include: { platform: true; user: true; posts: true };
}>;

export type SocialAccountWithPlatform = Prisma.SocialAccountGetPayload<{
  include: { platform: true };
}>;

export const SOCIAL_ACCOUNT_PUBLIC_SELECT = {
  id: true,
  platformId: true,
  userId: true,
  accountId: true,
  username: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  disconnectState: true,
} as const;

export type SocialAccountPublic = Prisma.SocialAccountGetPayload<{
  select: typeof SOCIAL_ACCOUNT_PUBLIC_SELECT;
}>;

const SOCIAL_ACCOUNT_INCLUDE = {
  platform: true,
  user: true,
  posts: true,
} as const;

@Injectable()
export class SocialAccountReader {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SocialAccountWhereUniqueInput;
    where?: Prisma.SocialAccountWhereInput;
    orderBy?: Prisma.SocialAccountOrderByWithRelationInput;
  }): Promise<SocialAccountWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.socialAccount.findMany({
      skip,
      take,
      cursor,
      where: { ...where, deletedAt: null },
      orderBy,
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.SocialAccountWhereUniqueInput,
  ): Promise<SocialAccountWithRelations | null> {
    return this.prisma.socialAccount.findFirst({
      where: { ...where, deletedAt: null },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findIncludingDeleted(
    where: Prisma.SocialAccountWhereUniqueInput,
  ): Promise<SocialAccountWithRelations | null> {
    return this.prisma.socialAccount.findUnique({
      where,
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findManyByIdsForUser(
    userId: number,
    ids: number[],
  ): Promise<SocialAccountWithPlatform[]> {
    return this.prisma.socialAccount.findMany({
      where: { userId, id: { in: ids }, deletedAt: null },
      include: { platform: true },
    });
  }

  async findByUserId(userId: number): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: { userId, deletedAt: null },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findByPlatformId(
    platformId: number,
  ): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: { platformId, deletedAt: null },
      include: SOCIAL_ACCOUNT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformAndAccountId(
    platformId: number,
    accountId: string,
  ): Promise<SocialAccountWithRelations | null> {
    return this.prisma.socialAccount.findFirst({
      where: {
        platformId,
        accountId,
        deletedAt: null,
      },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findByPlatformAndInstagramUserId(
    platformId: number,
    userId: string,
  ): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: {
        platformId,
        deletedAt: null,
        OR: [{ accountId: userId }, { appScopedUserId: userId }],
      },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findIncludingDeletedByPlatformAndAccountId(
    platformId: number,
    accountId: string,
  ): Promise<SocialAccountWithRelations | null> {
    return this.prisma.socialAccount.findUnique({
      where: { platformId_accountId: { platformId, accountId } },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findByUserAndPlatform(
    userId: number,
    platformId: number,
  ): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: {
        userId,
        platformId,
        deletedAt: null,
      },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async count(where?: Prisma.SocialAccountWhereInput): Promise<number> {
    return this.prisma.socialAccount.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(where: Prisma.SocialAccountWhereInput): Promise<boolean> {
    const count = await this.prisma.socialAccount.count({
      where: { ...where, deletedAt: null },
    });
    return count > 0;
  }

  async findExpiredTokens(): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: {
        deletedAt: null,
        accessToken: { not: null },
        tokenExpiry: {
          lte: new Date(),
        },
      },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }
}
