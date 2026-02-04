import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '@backend/auth/dto/auth-register.dto';
import { LoginDto } from '@backend/auth/dto/login.dto';
import { Request, Response } from 'express';
import {
  getAuthCookieOptions,
  JwtAuthGuard,
  CurrentUser,
  JwtPayload,
} from '@backend/common';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface SocialAccountResponse {
  id: number;
  platform: {
    id: number;
    name: string;
    displayName: string;
  };
  username: string;
  accountId: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string | null;
}

export interface UserProfileResponse extends UserResponse {
  socialAccounts: SocialAccountResponse[];
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.register(body);
    const { accessToken, refreshToken } = await this.authService.login(user);

    this.setRefreshTokenCookie(response, refreshToken);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      } as UserResponse,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.authService.login(user);

    this.setRefreshTokenCookie(response, refreshToken);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      } as UserResponse,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserProfileResponse> {
    const user = await this.authService.getUserProfile(currentUser.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      socialAccounts: user.socialAccounts.map((account) => ({
        id: account.id,
        platform: {
          id: account.platform.id,
          name: account.platform.name,
          displayName: account.platform.displayName,
        },
        username: account.username,
        accountId: account.accountId,
      })),
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(oldRefreshToken);

    this.setRefreshTokenCookie(response, refreshToken);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    this.clearRefreshTokenCookie(response);

    return { message: 'Logged out successfully' };
  }

  private setRefreshTokenCookie(response: Response, token: string): void {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
      ...getAuthCookieOptions(),
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/api/v1/auth',
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...getAuthCookieOptions(),
      path: '/api/v1/auth',
    });
  }
}
