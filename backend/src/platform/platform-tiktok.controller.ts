import { Controller, Get, Post, Query, Body, Logger } from '@nestjs/common';
import { PlatformConnectTikTokService } from './platform-connect-tiktok.service';

export interface AuthUrlRequest {
  state?: string;
}

export interface TokenExchangeRequest {
  code: string;
}

export interface TokenRequest {
  accessToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

@Controller('platform/tiktok')
export class TikTokController {
  private readonly logger = new Logger(TikTokController.name);

  constructor(private readonly tiktokService: PlatformConnectTikTokService) {}

  @Get('auth-url')
  generateAuthUrl(@Query() query: AuthUrlRequest) {
    this.logger.log('Generating TikTok OAuth URL');
    return {
      authUrl: this.tiktokService.generateAuthUrl(query.state),
      platform: 'tiktok',
    };
  }

  @Post('exchange-token')
  async exchangeToken(@Body() body: TokenExchangeRequest) {
    this.logger.log('Exchanging TikTok authorization code for token');
    const tokenResponse = await this.tiktokService.exchangeCodeForToken(
      body.code,
    );

    return {
      ...tokenResponse,
      platform: 'tiktok',
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: RefreshTokenRequest) {
    this.logger.log('Refreshing TikTok access token');
    const refreshedToken = await this.tiktokService.refreshAccessToken(
      body.refreshToken,
    );

    return {
      ...refreshedToken,
      platform: 'tiktok',
    };
  }

  @Post('user-info')
  async getUserInfo(@Body() body: TokenRequest) {
    this.logger.log('Fetching TikTok user information');
    const userInfo = await this.tiktokService.getUserInfo(body.accessToken);

    return {
      user: userInfo,
      platform: 'tiktok',
    };
  }

  @Post('revoke-token')
  async revokeToken(@Body() body: TokenRequest) {
    this.logger.log('Revoking TikTok access token');
    await this.tiktokService.revokeToken(body.accessToken);

    return {
      success: true,
      platform: 'tiktok',
      message: 'Token successfully revoked',
    };
  }

  @Get('config-status')
  getConfigStatus() {
    this.logger.log('Checking TikTok service configuration');
    const configStatus = this.tiktokService.getConfigStatus();

    return {
      ...configStatus,
      platform: 'tiktok',
    };
  }

  @Get('health')
  getHealth() {
    this.logger.log('Checking TikTok service health');
    return {
      status: 'healthy',
      configured: this.tiktokService.isConfigured(),
      platform: 'tiktok',
      timestamp: new Date().toISOString(),
    };
  }
}