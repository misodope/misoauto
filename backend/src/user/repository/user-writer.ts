import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserWriter {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        socialAccounts: true,
        videos: true,
      },
    });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
      include: {
        socialAccounts: true,
        videos: true,
      },
    });
  }

  async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
