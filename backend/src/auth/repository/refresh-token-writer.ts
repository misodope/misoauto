import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class RefreshTokenWriter {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    tokenHash: string;
    userId: number;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async deleteByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    try {
      return await this.prisma.refreshToken.delete({
        where: { tokenHash },
      });
    } catch {
      return null;
    }
  }

  async deleteAllByUserId(userId: number): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}
