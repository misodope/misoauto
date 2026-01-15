import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialAccount, Prisma } from '@prisma/client';

@Injectable()
export class SocialAccountWriter {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SocialAccountCreateInput): Promise<SocialAccount> {
    return this.prisma.socialAccount.create({
      data,
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }

  async update(params: {
    where: Prisma.SocialAccountWhereUniqueInput;
    data: Prisma.SocialAccountUpdateInput;
  }): Promise<SocialAccount> {
    const { where, data } = params;
    return this.prisma.socialAccount.update({
      data,
      where,
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }

  async updateTokens(params: {
    id: number;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  }): Promise<SocialAccount> {
    const { id, accessToken, refreshToken, tokenExpiry } = params;
    return this.prisma.socialAccount.update({
      where: { id },
      data: {
        accessToken,
        refreshToken,
        tokenExpiry,
      },
      include: {
        platform: true,
        user: true,
        posts: true,
      },
    });
  }

  async delete(
    where: Prisma.SocialAccountWhereUniqueInput,
  ): Promise<SocialAccount> {
    return this.prisma.socialAccount.delete({
      where,
    });
  }
}
