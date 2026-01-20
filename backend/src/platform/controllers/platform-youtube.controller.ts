import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  Logger,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PlatformConnectYouTubeService } from '../services/platform-connect-youtube.service';
import {
  JwtAuthGuard,
  CurrentUser,
  JwtPayload,
  getOAuthCookieOptions,
} from '@backend/common';

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

  @Get('oauth')
  @UseGuards(JwtAuthGuard)
  initiateOAuth(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    this.logger.log(
      `Initiating YouTube OAuth flow for user ${user.sub} (${user.email})`,
    );

    // Generate CSRF state token
    const csrfState = Math.random().toString(36).substring(2);

    // Store CSRF state and userId in cookies for redirect validation
    res.cookie('csrfState', csrfState, {
      ...getOAuthCookieOptions(),
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
    res.cookie('oauthUserId', user.sub.toString(), {
      ...getOAuthCookieOptions(),
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    // Generate auth URL and redirect
    const authUrl = this.youtubeService.generateAuthUrl(csrfState);
    res.redirect(authUrl);
  }

  @Get('redirect')
  async handleOAuthRedirect(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log('Handling YouTube OAuth redirect');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

    // Extract CSRF state and userId from cookies
    const csrfState = req.cookies?.csrfState;
    const userId = req.cookies?.oauthUserId;

    // Verify CSRF state
    if (!csrfState || csrfState !== state) {
      this.logger.error('CSRF state mismatch');
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(`${frontendUrl}/integrations?error=csrf_mismatch`);
    }

    if (!userId) {
      this.logger.error('Missing user ID from cookies');
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(`${frontendUrl}/integrations?error=missing_user_id`);
    }

    // Handle OAuth error
    if (error) {
      this.logger.error(`YouTube OAuth error: ${error} - ${errorDescription}`);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(
        `${frontendUrl}/integrations?error=${error}&error_description=${errorDescription}`,
      );
    }

    try {
      // Exchange code for token
      const tokenResponse =
        await this.youtubeService.exchangeCodeForToken(code);

      // Save account to database
      await this.youtubeService.saveOAuthAccount({
        userId: parseInt(userId),
        tokenResponse,
      });

      // Clear OAuth cookies
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');

      // Redirect to homepage on success
      this.logger.log('YouTube account connected successfully');
      res.redirect(`${frontendUrl}/?success=youtube_connected`);
    } catch (err) {
      this.logger.error('Failed to save YouTube account:', err);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      res.redirect(`${frontendUrl}/integrations?error=connection_failed`);
    }
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
}
