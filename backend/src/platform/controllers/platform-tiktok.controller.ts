import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Logger,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PlatformConnectTikTokService } from '../services/platform-connect-tiktok.service';
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

export interface VideoListRequest {
  cursor?: number;
  maxCount?: number;
}

export interface VideoQueryRequest {
  videoIds: string[];
}

export interface UploadDraftRequest {
  videoId: number;
}

export interface PublishStatusRequest {
  publishId: string;
}

const isDev = () => process.env.NODE_ENV !== 'production';

@Controller('platform/tiktok')
export class TikTokController {
  private readonly logger = new Logger(TikTokController.name);

  constructor(
    private readonly tiktokService: PlatformConnectTikTokService,
    private readonly videosService: VideosService,
  ) {}

  @Get('oauth')
  @UseGuards(JwtAuthGuard)
  initiateOAuth(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    this.logger.log(
      `Initiating TikTok OAuth flow for user ${user.sub} (${user.email})`,
    );

    // Generate CSRF state token
    const csrfState = Math.random().toString(36).substring(2);

    // In dev mode: encode userId in state to avoid cookie issues with ngrok
    // In prod mode: use cookies for CSRF validation
    const state = isDev() ? `${csrfState}:${user.sub}` : csrfState;

    if (!isDev()) {
      // Store CSRF state and userId in cookies for redirect validation (production only)
      res.cookie('csrfState', csrfState, {
        ...getOAuthCookieOptions(),
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
      res.cookie('oauthUserId', user.sub.toString(), {
        ...getOAuthCookieOptions(),
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
    }

    // Generate auth URL and redirect
    const authUrl = this.tiktokService.generateAuthUrl(state);
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
    this.logger.log('Handling TikTok OAuth redirect');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

    let userId: string | undefined;

    if (isDev()) {
      // In dev mode: extract userId from state parameter (format: "csrf:userId")
      const stateParts = state?.split(':');
      if (stateParts?.length === 2) {
        userId = stateParts[1];
        this.logger.log(`Dev mode: extracted userId ${userId} from state`);
      }
    } else {
      // In prod mode: use cookies for CSRF validation
      const csrfState = req.cookies?.csrfState;
      userId = req.cookies?.oauthUserId;

      // Verify CSRF state
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

    // Handle OAuth error
    if (error) {
      this.logger.error(`TikTok OAuth error: ${error} - ${errorDescription}`);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(
        `${frontendUrl}/integrations?error=${error}&error_description=${errorDescription}`,
      );
    }

    try {
      // Exchange code for token
      const tokenResponse = await this.tiktokService.exchangeCodeForToken(code);

      // Save account to database
      await this.tiktokService.saveOAuthAccount({
        userId: parseInt(userId),
        tokenResponse,
      });

      // Clear OAuth cookies (production)
      if (!isDev()) {
        res.clearCookie('csrfState');
        res.clearCookie('oauthUserId');
      }

      // Redirect to homepage on success
      this.logger.log('TikTok account connected successfully');
      res.redirect(`${frontendUrl}/?success=tiktok_connected`);
    } catch (err) {
      this.logger.error('Failed to save TikTok account:', err);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      res.redirect(`${frontendUrl}/integrations?error=connection_failed`);
    }
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

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@CurrentUser() user: JwtPayload) {
    this.logger.log(`Fetching TikTok user info for user ${user.sub}`);
    const accessToken = await this.tiktokService.getAccessTokenForUser(
      user.sub,
    );
    const userInfo = await this.tiktokService.getUserInfo(accessToken);

    return {
      user: userInfo,
      platform: 'tiktok',
    };
  }

  @Post('videos')
  @UseGuards(JwtAuthGuard)
  async getVideoList(
    @CurrentUser() user: JwtPayload,
    @Body() body: VideoListRequest,
  ) {
    this.logger.log(`Fetching TikTok video list for user ${user.sub}`);
    const accessToken = await this.tiktokService.getAccessTokenForUser(
      user.sub,
    );
    const videoList = await this.tiktokService.getVideoList(
      accessToken,
      body.cursor,
      body.maxCount,
    );

    return {
      ...videoList,
      platform: 'tiktok',
    };
  }

  @Post('videos/query')
  @UseGuards(JwtAuthGuard)
  async queryVideos(
    @CurrentUser() user: JwtPayload,
    @Body() body: VideoQueryRequest,
  ) {
    this.logger.log(`Querying TikTok videos for user ${user.sub}`);
    const accessToken = await this.tiktokService.getAccessTokenForUser(
      user.sub,
    );
    const result = await this.tiktokService.queryVideos(
      accessToken,
      body.videoIds,
    );

    return {
      ...result,
      platform: 'tiktok',
    };
  }

  @Post('upload-draft')
  @UseGuards(JwtAuthGuard)
  async uploadDraftVideo(
    @CurrentUser() user: JwtPayload,
    @Body() body: UploadDraftRequest,
  ) {
    this.logger.log(
      `Uploading draft video ${body.videoId} to TikTok for user ${user.sub}`,
    );

    const accessToken = await this.tiktokService.getAccessTokenForUser(
      user.sub,
    );

    // Get signed R2 download URL for TikTok to pull from
    const { url: videoUrl } = await this.videosService.getVideoDownloadUrl(
      user.sub,
      body.videoId,
    );

    const result = await this.tiktokService.initializeVideoUploadDraft(
      accessToken,
      videoUrl,
      body.videoId,
    );

    return {
      ...result,
      platform: 'tiktok',
    };
  }

  @Post('publish-status')
  @UseGuards(JwtAuthGuard)
  async getPublishStatus(
    @CurrentUser() user: JwtPayload,
    @Body() body: PublishStatusRequest,
  ) {
    this.logger.log(
      `Fetching publish status ${body.publishId} for user ${user.sub}`,
    );
    const accessToken = await this.tiktokService.getAccessTokenForUser(
      user.sub,
    );
    const result = await this.tiktokService.getPublishStatus(
      accessToken,
      body.publishId,
    );

    return {
      ...result,
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
}
