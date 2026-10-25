import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  SocialAccount,
  Prisma,
  SocialAccountDisconnectState,
} from '@backend/generated/prisma/client';

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
    expectedTokenVersion?: number;
  }): Promise<SocialAccount | null> {
    const { id, accessToken, refreshToken, tokenExpiry, expectedTokenVersion } =
      params;
    const result = await this.prisma.socialAccount.updateMany({
      where: {
        id,
        deletedAt: null,
        disconnectState: SocialAccountDisconnectState.ACTIVE,
        ...(expectedTokenVersion === undefined
          ? {}
          : { tokenVersion: expectedTokenVersion }),
      },
      data: {
        accessToken,
        ...(refreshToken === undefined ? {} : { refreshToken }),
        ...(tokenExpiry === undefined ? {} : { tokenExpiry }),
        tokenVersion: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.socialAccount.findUnique({ where: { id } });
  }

  async beginDisconnect(id: number, userId: number): Promise<boolean> {
    const result = await this.prisma.socialAccount.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
        disconnectState: SocialAccountDisconnectState.ACTIVE,
      },
      data: {
        deletedAt: new Date(),
        disconnectStartedAt: new Date(),
        disconnectState: SocialAccountDisconnectState.DISCONNECTING,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        disconnectError: null,
        tokenVersion: { increment: 1 },
      },
    });

    return result.count === 1;
  }

  async finishDisconnect(
    id: number,
    disconnectError?: string,
  ): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.update({
      where: { id },
      data: {
        disconnectState: SocialAccountDisconnectState.DISCONNECTED,
        disconnectError: disconnectError ?? null,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        tokenVersion: { increment: 1 },
      },
    });
  }

  async reactivateWithTokens(params: {
    id: number;
    userId: number;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  }): Promise<SocialAccount | null> {
    const result = await this.prisma.socialAccount.updateMany({
      where: {
        id: params.id,
        userId: params.userId,
        deletedAt: { not: null },
        disconnectState: SocialAccountDisconnectState.DISCONNECTED,
      },
      data: {
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        tokenExpiry: params.tokenExpiry,
        deletedAt: null,
        disconnectState: SocialAccountDisconnectState.ACTIVE,
        disconnectStartedAt: null,
        disconnectError: null,
        tokenVersion: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.socialAccount.findUnique({ where: { id: params.id } });
  }
}
