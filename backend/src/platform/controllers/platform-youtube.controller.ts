import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  CurrentUser,
  getOAuthCookieOptions,
  JwtAuthGuard,
  JwtPayload,
  validateBody,
} from '@backend/common';
import { VideosService } from '@backend/videos/services/videos.service';
import { PlatformConnectYouTubeService } from '../services/platform-connect-youtube.service';
import {
  YouTubePublishDto,
  YouTubePublishStatusDto,
  YouTubeUploadDraftDto,
} from '../dto';

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
      this.logger.warn('Missing user ID in YouTube OAuth callback');
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(`${frontendUrl}/integrations?error=missing_user_id`);
    }

    if (error) {
      this.logger.error(`YouTube OAuth error: ${error} - ${errorDescription}`);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(
        `${frontendUrl}/integrations?${new URLSearchParams({
          error,
          error_description: errorDescription ?? '',
        }).toString()}`,
      );
    }

    try {
      const tokenResponse =
        await this.youtubeService.exchangeCodeForToken(code);
      await this.youtubeService.saveOAuthAccount({
        userId: parseInt(userId, 10),
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
    @Body(validateBody) body: YouTubeUploadDraftDto,
  ) {
    this.logger.log(
      `Uploading draft video ${body.videoId} to YouTube for user ${user.sub}`,
    );

    const account = await this.youtubeService.getAccountForUser(user.sub);
    const video = await this.videosService.getVideo(user.sub, body.videoId);
    const title = (body.title ?? video.title).trim();
    const description = body.description ?? video.description ?? '';

    this.youtubeService.validateYouTubeVideo(video, { title, description });

    const result = await this.youtubeService.initializeVideoUpload({
      accessToken: account.accessToken,
      s3Key: video.s3Key,
      videoId: body.videoId,
      title,
      description,
      madeForKids: body.madeForKids ?? false,
      thumbnailKey: video.s3ThumbnailKey,
    });

    return { ...result, platform: 'youtube' };
  }

  @Post('publish-status')
  @UseGuards(JwtAuthGuard)
  async getPublishStatus(
    @CurrentUser() user: JwtPayload,
    @Body(validateBody) body: YouTubePublishStatusDto,
  ) {
    this.logger.log(
      `Fetching processing status for YouTube video ${body.videoId} for user ${user.sub}`,
    );

    const result = await this.youtubeService.getProcessingStatusForUser(
      user.sub,
      body.videoId,
    );

    return { ...result, platform: 'youtube' };
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard)
  async publish(
    @CurrentUser() user: JwtPayload,
    @Body(validateBody) body: YouTubePublishDto,
  ) {
    this.logger.log(
      `Publishing YouTube video ${body.videoId} for user ${user.sub}`,
    );

    const result = await this.youtubeService.publishForUser(
      user.sub,
      body.videoId,
      body.privacyStatus ?? 'public',
    );

    return { ...result, platform: 'youtube' };
  }
}
