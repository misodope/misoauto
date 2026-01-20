import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { AuthReader } from '../repository/auth-reader';
import { AuthWriter } from '../repository/auth-writer';
import { RefreshTokenReader } from '../repository/refresh-token-reader';
import { RefreshTokenWriter } from '../repository/refresh-token-writer';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from '@backend/auth/dto/auth-register.dto';

export interface TokenPayload {
  email: string;
  sub: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly refreshTokenExpiryDays = 7;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authReader: AuthReader,
    private readonly authWriter: AuthWriter,
    private readonly refreshTokenReader: RefreshTokenReader,
    private readonly refreshTokenWriter: RefreshTokenWriter,
  ) {}

  async register(data: RegisterDto): Promise<User> {
    const { email, password, name } = data;
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    return this.authWriter.createUser({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.authReader.findUserByEmail(email);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.authReader.findUserById(id);
  }

  async getUserProfile(id: number) {
    return this.authReader.findUserWithSocialAccounts(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.authReader.findAllUsers();
  }

  async updateUser(
    id: number,
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getUserById(id);
    if (user) {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return this.authWriter.updateUser({
        where: { id },
        data: { email, password: hashedPassword },
      });
    }
    return null;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.authReader.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = await this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    await this.refreshTokenWriter.create({
      tokenHash,
      userId,
      expiresAt,
    });

    return refreshToken;
  }

  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = await this.hashToken(oldRefreshToken);

    const storedToken =
      await this.refreshTokenReader.findValidByTokenHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.authReader.findUserById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke the old refresh token (rotation)
    await this.refreshTokenWriter.deleteByTokenHash(tokenHash);

    // Generate new tokens
    const payload: TokenPayload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    const tokenHash = await this.hashToken(refreshToken);
    const deleted = await this.refreshTokenWriter.deleteByTokenHash(tokenHash);
    return deleted !== null;
  }

  async revokeAllUserTokens(userId: number): Promise<number> {
    return this.refreshTokenWriter.deleteAllByUserId(userId);
  }

  async validateRefreshToken(refreshToken: string): Promise<TokenPayload> {
    const tokenHash = await this.hashToken(refreshToken);

    const storedToken =
      await this.refreshTokenReader.findValidByTokenHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.authReader.findUserById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { email: user.email, sub: user.id };
  }

  async cleanupExpiredTokens(): Promise<number> {
    return this.refreshTokenWriter.deleteExpired();
  }
}
