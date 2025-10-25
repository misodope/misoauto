import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  Logger,
} from '@nestjs/common';
import { PlatformConnectYouTubeService } from './platform-connect-youtube.service';

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

export interface ChannelVideosRequest {
  accessToken: string;
  maxResults?: number;
}

@Controller('platform/youtube')
export class YouTubeController {
  private readonly logger = new Logger(YouTubeController.name);

  constructor(private readonly youtubeService: PlatformConnectYouTubeService) {}

  @Get('auth-url')
  generateAuthUrl(@Query() query: AuthUrlRequest) {
    this.logger.log('Generating YouTube OAuth URL');
    return {
      authUrl: this.youtubeService.generateAuthUrl(query.state),
      platform: 'youtube',
    };
  }

  @Post('exchange-token')
  async exchangeToken(@Body() body: TokenExchangeRequest) {
    this.logger.log('Exchanging YouTube authorization code for token');
    const tokenResponse = await this.youtubeService.exchangeCodeForToken(
      body.code,
    );

    return {
      ...tokenResponse,
      platform: 'youtube',
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: RefreshTokenRequest) {
    this.logger.log('Refreshing YouTube access token');
    const refreshedToken = await this.youtubeService.refreshAccessToken(
      body.refreshToken,
    );

    return {
      ...refreshedToken,
      platform: 'youtube',
    };
  }

  @Post('channel-info')
  async getChannelInfo(@Body() body: TokenRequest) {
    this.logger.log('Fetching YouTube channel information');
    const channelInfo = await this.youtubeService.getChannelInfo(
      body.accessToken,
    );

    return {
      channel: channelInfo,
      platform: 'youtube',
    };
  }

  @Post('channel-videos')
  async getChannelVideos(@Body() body: ChannelVideosRequest) {
    this.logger.log('Fetching YouTube channel videos');
    const videos = await this.youtubeService.getChannelVideos(
      body.accessToken,
      body.maxResults,
    );

    return {
      videos,
      platform: 'youtube',
      count: videos.length,
    };
  }

  @Post('video/:videoId')
  async getVideoById(
    @Param('videoId') videoId: string,
    @Body() body: TokenRequest,
  ) {
    this.logger.log(`Fetching YouTube video by ID: ${videoId}`);
    const video = await this.youtubeService.getVideoById(
      videoId,
      body.accessToken,
    );

    return {
      video,
      platform: 'youtube',
    };
  }

  @Post('validate-token')
  async validateToken(@Body() body: TokenRequest) {
    this.logger.log('Validating YouTube access token');
    const isValid = await this.youtubeService.validateToken(body.accessToken);

    return {
      valid: isValid,
      platform: 'youtube',
    };
  }

  @Post('revoke-token')
  async revokeToken(@Body() body: TokenRequest) {
    this.logger.log('Revoking YouTube access token');
    await this.youtubeService.revokeToken(body.accessToken);

    return {
      success: true,
      platform: 'youtube',
      message: 'Token successfully revoked',
    };
  }

  @Get('config-status')
  getConfigStatus() {
    this.logger.log('Checking YouTube service configuration');
    const configStatus = this.youtubeService.getConfigStatus();

    return {
      ...configStatus,
      platform: 'youtube',
    };
  }

  @Get('health')
  getHealth() {
    this.logger.log('Checking YouTube service health');
    return {
      status: 'healthy',
      configured: this.youtubeService.isConfigured(),
      platform: 'youtube',
      timestamp: new Date().toISOString(),
    };
  }
}