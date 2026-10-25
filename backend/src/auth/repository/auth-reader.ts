import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User, Prisma } from '@backend/generated/prisma/client';

export type UserWithSocialAccounts = Prisma.UserGetPayload<{
  include: {
    socialAccounts: {
      select: {
        id: true;
        accountId: true;
        username: true;
        platform: { select: { id: true; name: true; displayName: true } };
      };
    };
  };
}>;

const SOCIAL_ACCOUNT_PROFILE_SELECT = {
  id: true,
  accountId: true,
  username: true,
  platform: { select: { id: true, name: true, displayName: true } },
} as const;

@Injectable()
export class AuthReader {
  constructor(private prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findUserWithSocialAccounts(
    id: number,
  ): Promise<UserWithSocialAccounts | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        socialAccounts: {
          where: {
            deletedAt: null,
            OR: [{ tokenExpiry: null }, { tokenExpiry: { gt: new Date() } }],
          },
          select: SOCIAL_ACCOUNT_PROFILE_SELECT,
        },
      },
    });
  }

  async findAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany({ where: { deletedAt: null } });
  }

  async userExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email, deletedAt: null },
    });
    return count > 0;
  }

  async countUsers(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({
      where: { ...where, deletedAt: null },
    });
  }
}
