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
import { VideosService } from '@backend/videos/services/videos.service';
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

export interface UploadDraftRequest {
  videoId: number;
}

export interface PublishStatusRequest {
  videoId: string; // YouTube's video ID (returned from upload-draft)
}

export interface ChannelVideosQueryRequest {
  maxResults?: number;
}

const isDev = () => process.env.NODE_ENV !== 'production';

@Controller('platform/youtube')
export class YouTubeController {
  private readonly logger = new Logger(YouTubeController.name);

  constructor(
    private readonly youtubeService: PlatformConnectYouTubeService,
    private readonly videosService: VideosService,
  ) {}

  @Get('oauth')
  @UseGuards(JwtAuthGuard)
  initiateOAuth(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    this.logger.log(
      `Initiating YouTube OAuth flow for user ${user.sub} (${user.email})`,
    );

    const csrfState = Math.random().toString(36).substring(2);
    const state = isDev() ? `${csrfState}:${user.sub}` : csrfState;

    if (!isDev()) {
      res.cookie('csrfState', csrfState, {
        ...getOAuthCookieOptions(),
        maxAge: 5 * 60 * 1000,
      });
      res.cookie('oauthUserId', user.sub.toString(), {
        ...getOAuthCookieOptions(),
        maxAge: 5 * 60 * 1000,
      });
    }

    const authUrl = this.youtubeService.generateAuthUrl(state);
    res.status(200).json({ url: authUrl });
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
    let userId: string | undefined;

    if (isDev()) {
      // Dev mode: extract userId from state parameter (format: "csrf:userId")
      const stateParts = state?.split(':');
      if (stateParts?.length === 2) {
        userId = stateParts[1];
        this.logger.log(`Dev mode: extracted userId ${userId} from state`);
      }
    } else {
      // Prod mode: validate CSRF via cookies
      const csrfState = req.cookies?.csrfState;
      userId = req.cookies?.oauthUserId;

      if (!csrfState || csrfState !== state) {
        this.logger.error('CSRF state mismatch');
        res.clearCookie('csrfState');
        res.clearCookie('oauthUserId');
        return res.redirect(`${frontendUrl}/integrations?error=csrf_mismatch`);
      }
    }

    if (!userId) {
      this.logger.error('Missing user ID');
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(`${frontendUrl}/integrations?error=missing_user_id`);
    }

    if (error) {
      this.logger.error(`YouTube OAuth error: ${error} - ${errorDescription}`);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(
        `${frontendUrl}/integrations?error=${error}&error_description=${errorDescription}`,
      );
    }

    try {
      const tokenResponse = await this.youtubeService.exchangeCodeForToken(code);
      await this.youtubeService.saveOAuthAccount({
        userId: parseInt(userId),
        tokenResponse,
      });

      if (!isDev()) {
        res.clearCookie('csrfState');
        res.clearCookie('oauthUserId');
      }

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

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@CurrentUser() user: JwtPayload) {
    this.logger.log(`Fetching YouTube channel info for user ${user.sub}`);
    const accessToken = await this.youtubeService.getAccessTokenForUser(
      user.sub,
    );
    const channelInfo = await this.youtubeService.getChannelInfo(accessToken);
    return { channel: channelInfo, platform: 'youtube' };
  }

  @Post('channel-info')
  @UseGuards(JwtAuthGuard)
  async getChannelInfo(@CurrentUser() user: JwtPayload) {
    this.logger.log(`Fetching YouTube channel info for user ${user.sub}`);
    const accessToken = await this.youtubeService.getAccessTokenForUser(
      user.sub,
    );
    const channelInfo = await this.youtubeService.getChannelInfo(accessToken);
    return { channel: channelInfo, platform: 'youtube' };
  }

  @Post('channel-videos')
  @UseGuards(JwtAuthGuard)
  async getChannelVideos(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChannelVideosQueryRequest,
  ) {
    this.logger.log(`Fetching YouTube channel videos for user ${user.sub}`);
    const accessToken = await this.youtubeService.getAccessTokenForUser(
      user.sub,
    );
    const videos = await this.youtubeService.getChannelVideos(
      accessToken,
      body.maxResults,
    );
    return { videos, platform: 'youtube', count: videos.length };
  }

  @Post('video/:videoId')
  @UseGuards(JwtAuthGuard)
  async getVideoById(
    @CurrentUser() user: JwtPayload,
    @Param('videoId') videoId: string,
  ) {
    this.logger.log(`Fetching YouTube video ${videoId} for user ${user.sub}`);
    const accessToken = await this.youtubeService.getAccessTokenForUser(
      user.sub,
    );
    const video = await this.youtubeService.getVideoById(videoId, accessToken);
    return { video, platform: 'youtube' };
  }

  @Post('upload-draft')
  @UseGuards(JwtAuthGuard)
  async uploadDraftVideo(
    @CurrentUser() user: JwtPayload,
    @Body() body: UploadDraftRequest,
  ) {
    this.logger.log(
      `Uploading draft video ${body.videoId} to YouTube for user ${user.sub}`,
    );

    const accessToken = await this.youtubeService.getAccessTokenForUser(
      user.sub,
    );

    const video = await this.videosService.getVideo(user.sub, body.videoId);

    const result = await this.youtubeService.initializeVideoUpload({
      accessToken,
      s3Key: video.s3Key,
      videoId: body.videoId,
      title: video.title,
      description: video.description ?? '',
    });

    return { ...result, platform: 'youtube' };
  }

  @Post('publish-status')
  @UseGuards(JwtAuthGuard)
  async getPublishStatus(
    @CurrentUser() user: JwtPayload,
    @Body() body: PublishStatusRequest,
  ) {
    this.logger.log(
      `Fetching processing status for YouTube video ${body.videoId} for user ${user.sub}`,
    );

    const accessToken = await this.youtubeService.getAccessTokenForUser(
      user.sub,
    );
    const result = await this.youtubeService.getVideoProcessingStatus(
      accessToken,
      body.videoId,
    );

    return { ...result, platform: 'youtube' };
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
