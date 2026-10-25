import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PlatformType } from '@backend/generated/prisma/client';
import {
  CurrentUser,
  getOAuthCookieOptions,
  JwtAuthGuard,
  JwtPayload,
  validateBody,
  createDevelopmentOAuthState,
  createOAuthNonce,
  parseDevelopmentOAuthState,
} from '@backend/common';
import { VideosService } from '@backend/videos/services/videos.service';
import { VideoPostDraftReader } from '@backend/video-posts/repository/video-post-draft-reader';
import { PlatformReader } from '../repository/platform-reader';
import { PlatformConnectInstagramService } from '../services/platform-connect-instagram.service';
import { InstagramContainerDto, InstagramUploadDraftDto } from '../dto';

const isDev = () => process.env.NODE_ENV !== 'production';

@Controller('platform/instagram')
export class InstagramController {
  private readonly logger = new Logger(InstagramController.name);

  constructor(
    private readonly instagramService: PlatformConnectInstagramService,
    private readonly videosService: VideosService,
    private readonly platformReader: PlatformReader,
    private readonly videoPostDraftReader: VideoPostDraftReader,
  ) {}

  @Get('oauth')
  @UseGuards(JwtAuthGuard)
  initiateOAuth(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    this.logger.log(
      `Initiating Instagram OAuth flow for user ${user.sub} (${user.email})`,
    );

    const csrfState = createOAuthNonce();
    const state = isDev() ? createDevelopmentOAuthState(user.sub) : csrfState;

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

    const authUrl = this.instagramService.generateAuthUrl(state);
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
    this.logger.log('Handling Instagram OAuth redirect');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    let userId: string | undefined;

    if (isDev()) {
      const parsedUserId = parseDevelopmentOAuthState(state);
      if (parsedUserId) {
        userId = parsedUserId.toString();
        this.logger.log(`Dev mode: extracted userId ${userId} from state`);
      }
    } else {
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
      this.logger.warn('Missing user ID in Instagram OAuth callback');
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(`${frontendUrl}/integrations?error=missing_user_id`);
    }

    if (error) {
      this.logger.error(
        `Instagram OAuth error: ${error} - ${errorDescription}`,
      );
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      return res.redirect(
        `${frontendUrl}/integrations?error=${error}&error_description=${errorDescription}`,
      );
    }

    try {
      const tokenResponse =
        await this.instagramService.exchangeCodeForToken(code);

      await this.instagramService.saveOAuthAccount({
        userId: parseInt(userId, 10),
        shortLivedToken: tokenResponse.access_token,
      });

      if (!isDev()) {
        res.clearCookie('csrfState');
        res.clearCookie('oauthUserId');
      }

      this.logger.log('Instagram account connected successfully');
      res.redirect(`${frontendUrl}/?success=instagram_connected`);
    } catch (err) {
      this.logger.error('Failed to save Instagram account:', err);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      res.redirect(`${frontendUrl}/integrations?error=connection_failed`);
    }
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@CurrentUser() user: JwtPayload) {
    this.logger.log(`Fetching Instagram user info for user ${user.sub}`);
    const accessToken = await this.instagramService.getAccessTokenForUser(
      user.sub,
    );
    const userInfo = await this.instagramService.getUserInfo(accessToken);

    return {
      user: userInfo,
      platform: 'instagram',
    };
  }

  @Post('upload-draft')
  @UseGuards(JwtAuthGuard)
  async uploadDraft(
    @CurrentUser() user: JwtPayload,
    @Body(validateBody) body: InstagramUploadDraftDto,
  ) {
    const account = await this.getInstagramAccount(user.sub);
    const video = await this.videosService.getVideo(user.sub, body.videoId);
    const caption = body.caption ?? video.description ?? '';

    this.instagramService.validateReelVideo(video, caption);

    const [videoUrl, coverUrl] = await Promise.all([
      this.videosService.getVideoPublicUrl(user.sub, body.videoId),
      this.videosService.getThumbnailPublicUrl(user.sub, body.videoId),
    ]);

    const result = await this.instagramService.createReelContainer({
      accessToken: account.accessToken,
      igUserId: account.accountId,
      videoUrl,
      caption,
      coverUrl,
      shareToFeed: body.shareToFeed ?? true,
      videoId: body.videoId,
      platformId: account.platformId,
    });

    return { ...result, platform: 'instagram' };
  }

  @Post('publish-status')
  @UseGuards(JwtAuthGuard)
  async getPublishStatus(
    @CurrentUser() user: JwtPayload,
    @Body(validateBody) body: InstagramContainerDto,
  ) {
    const draft = await this.getOwnedDraft(user.sub, body.containerId);
    const account = await this.getInstagramAccount(user.sub);
    const result = await this.instagramService.getContainerStatus(
      account.accessToken,
      draft.platformVideoId,
    );

    return { ...result, platform: 'instagram' };
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard)
  async publish(
    @CurrentUser() user: JwtPayload,
    @Body(validateBody) body: InstagramContainerDto,
  ) {
    const draft = await this.getOwnedDraft(user.sub, body.containerId);
    const account = await this.getInstagramAccount(user.sub);
    const result = await this.instagramService.publishContainer({
      accessToken: account.accessToken,
      igUserId: account.accountId,
      containerId: draft.platformVideoId,
      videoId: draft.videoId,
      platformId: account.platformId,
      socialAccountId: account.id,
    });

    return { ...result, platform: 'instagram' };
  }

  @Get('publishing-limit')
  @UseGuards(JwtAuthGuard)
  async getPublishingLimit(@CurrentUser() user: JwtPayload) {
    const account = await this.getInstagramAccount(user.sub);
    const limit = await this.instagramService.getPublishingLimit(
      account.accessToken,
      account.accountId,
    );

    return { ...limit, platform: 'instagram' };
  }

  private async getInstagramAccount(userId: number) {
    const platform = await this.platformReader.findByName(
      PlatformType.INSTAGRAM,
    );
    if (!platform) {
      throw new NotFoundException('Instagram platform not found');
    }

    const account = await this.instagramService.getAccountForUser(userId);
    if (account.platformId !== platform.id) {
      throw new NotFoundException('Instagram account not found');
    }

    return account;
  }

  private async getOwnedDraft(userId: number, containerId: string) {
    const draft =
      await this.videoPostDraftReader.findByPlatformVideoId(containerId);

    if (
      !draft ||
      draft.video.userId !== userId ||
      draft.platform?.name !== PlatformType.INSTAGRAM
    ) {
      throw new NotFoundException('Instagram draft not found');
    }

    return draft;
  }
}
