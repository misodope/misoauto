import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RefreshToken } from '@backend/generated/prisma/client';

@Injectable()
export class RefreshTokenReader {
  constructor(private prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async findValidByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        revokedAt: null,
        user: { deletedAt: null },
      },
    });
  }

  async findAllByUserId(userId: number): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });
  }

  async countByUserId(userId: number): Promise<number> {
    return this.prisma.refreshToken.count({
      where: { userId, revokedAt: null },
    });
  }
}
