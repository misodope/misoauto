import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export type SocialAccountWithRelations = Prisma.SocialAccountGetPayload<{
  include: { platform: true; user: true; posts: true };
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
      where,
      orderBy,
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.SocialAccountWhereUniqueInput,
  ): Promise<SocialAccountWithRelations | null> {
    return this.prisma.socialAccount.findUnique({
      where,
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findByUserId(userId: number): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: { userId },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async findByPlatformId(
    platformId: number,
  ): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: { platformId },
      include: SOCIAL_ACCOUNT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformAndAccountId(
    platformId: number,
    accountId: string,
  ): Promise<SocialAccountWithRelations | null> {
    return this.prisma.socialAccount.findUnique({
      where: {
        platformId_accountId: {
          platformId,
          accountId,
        },
      },
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
      },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }

  async count(where?: Prisma.SocialAccountWhereInput): Promise<number> {
    return this.prisma.socialAccount.count({ where });
  }

  async exists(where: Prisma.SocialAccountWhereInput): Promise<boolean> {
    const count = await this.prisma.socialAccount.count({ where });
    return count > 0;
  }

  async findExpiredTokens(): Promise<SocialAccountWithRelations[]> {
    return this.prisma.socialAccount.findMany({
      where: {
        tokenExpiry: {
          lte: new Date(),
        },
      },
      include: SOCIAL_ACCOUNT_INCLUDE,
    });
  }
}
