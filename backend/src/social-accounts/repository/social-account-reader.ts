import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SocialAccount, Prisma } from '@prisma/client';

type SocialAccountWithAllRelations = Prisma.SocialAccountGetPayload<{ include: { platform: true; user: true; posts: true; } }>;

@Injectable()
export class SocialAccountReader {
  constructor(private prisma: PrismaService) { }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SocialAccountWhereUniqueInput;
    where?: Prisma.SocialAccountWhereInput;
    orderBy?: Prisma.SocialAccountOrderByWithRelationInput;
  }): Promise<SocialAccountWithAllRelations[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.socialAccount.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }

  async findOne(
    where: Prisma.SocialAccountWhereUniqueInput,
  ): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where,
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }

  async findByUserId(userId: number): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: { userId },
      include: {
        platform: true,
        posts: true,
      },
    });
  }

  async findByPlatformId(platformId: number): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: { platformId },
      include: {
        platform: true,
        user: true,
        posts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatformAndAccountId(
    platformId: number,
    accountId: string,
  ): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where: {
        platformId_accountId: {
          platformId,
          accountId,
        },
      },
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }

  async findByUserAndPlatform(
    userId: number,
    platformId: number,
  ): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: {
        userId,
        platformId,
      },
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }

  async count(where?: Prisma.SocialAccountWhereInput): Promise<number> {
    return this.prisma.socialAccount.count({ where });
  }

  async exists(where: Prisma.SocialAccountWhereInput): Promise<boolean> {
    const count = await this.prisma.socialAccount.count({ where });
    return count > 0;
  }

  async findExpiredTokens(): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: {
        tokenExpiry: {
          lte: new Date(),
        },
      },
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }
}
