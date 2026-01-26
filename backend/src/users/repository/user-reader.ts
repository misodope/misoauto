import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { socialAccounts: true; videos: true };
}>;

const USER_INCLUDE = {
  socialAccounts: true,
  videos: true,
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
      where,
      orderBy,
      include: USER_INCLUDE,
    });
  }

  async findOne(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where,
      include: USER_INCLUDE,
    });
  }

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async exists(where: Prisma.UserWhereInput): Promise<boolean> {
    const count = await this.prisma.user.count({ where });
    return count > 0;
  }
}
