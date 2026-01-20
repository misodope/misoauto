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
import { PlatformConnectInstagramService } from '../services/platform-connect-instagram.service';
import { JwtAuthGuard } from '@backend/common/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '@backend/common/decorators/current-user.decorator';

export interface TokenExchangeRequest {
  code: string;
}

export interface TokenRequest {
  accessToken: string;
}

export interface UserMediaRequest {
  accessToken: string;
  limit?: number;
}

@Controller('platform/instagram')
export class InstagramController {
  private readonly logger = new Logger(InstagramController.name);

  constructor(
    private readonly instagramService: PlatformConnectInstagramService,
  ) {}

  @Get('oauth')
  @UseGuards(JwtAuthGuard)
  initiateOAuth(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    this.logger.log(
      `Initiating Instagram OAuth flow for user ${user.sub} (${user.email})`,
    );

    // Generate CSRF state token
    const csrfState = Math.random().toString(36).substring(2);

    // Store CSRF state and userId in cookies for redirect validation
    res.cookie('csrfState', csrfState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
    res.cookie('oauthUserId', user.sub.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    // Generate auth URL and redirect
    const authUrl = this.instagramService.generateAuthUrl(csrfState);
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
    this.logger.log('Handling Instagram OAuth redirect');

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
      // Exchange code for short-lived token
      const shortLivedToken =
        await this.instagramService.exchangeCodeForToken(code);

      // Save account to database (exchanges for long-lived token internally)
      await this.instagramService.saveOAuthAccount({
        userId: parseInt(userId),
        shortLivedToken: shortLivedToken.access_token,
        instagramUserId: shortLivedToken.user_id.toString(),
      });

      // Clear OAuth cookies
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');

      // Redirect to homepage on success
      this.logger.log('Instagram account connected successfully');
      res.redirect(`${frontendUrl}/?success=instagram_connected`);
    } catch (err) {
      this.logger.error('Failed to save Instagram account:', err);
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');
      res.redirect(`${frontendUrl}/integrations?error=connection_failed`);
    }
  }

  @Post('exchange-token')
  async exchangeToken(@Body() body: TokenExchangeRequest) {
    this.logger.log('Exchanging Instagram authorization code for tokens');
    const shortLivedToken = await this.instagramService.exchangeCodeForToken(
      body.code,
    );
    const longLivedToken =
      await this.instagramService.exchangeForLongLivedToken(
        shortLivedToken.access_token,
      );

    return {
      shortLivedToken,
      longLivedToken,
      platform: 'instagram',
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: TokenRequest) {
    this.logger.log('Refreshing Instagram long-lived token');
    const refreshedToken = await this.instagramService.refreshLongLivedToken(
      body.accessToken,
    );

    return {
      ...refreshedToken,
      platform: 'instagram',
    };
  }

  @Post('user-info')
  async getUserInfo(@Body() body: TokenRequest) {
    this.logger.log('Fetching Instagram user information');
    const userInfo = await this.instagramService.getUserInfo(body.accessToken);

    return {
      user: userInfo,
      platform: 'instagram',
    };
  }

  @Post('user-media')
  async getUserMedia(@Body() body: UserMediaRequest) {
    this.logger.log('Fetching Instagram user media');
    const media = await this.instagramService.getUserMedia(
      body.accessToken,
      body.limit,
    );

    return {
      media,
      platform: 'instagram',
      count: media.length,
    };
  }

  @Post('media/:mediaId')
  async getMediaById(
    @Param('mediaId') mediaId: string,
    @Body() body: TokenRequest,
  ) {
    this.logger.log(`Fetching Instagram media by ID: ${mediaId}`);
    const media = await this.instagramService.getMediaById(
      mediaId,
      body.accessToken,
    );

    return {
      media,
      platform: 'instagram',
    };
  }

  @Post('validate-token')
  async validateToken(@Body() body: TokenRequest) {
    this.logger.log('Validating Instagram access token');
    const isValid = await this.instagramService.validateToken(body.accessToken);

    return {
      valid: isValid,
      platform: 'instagram',
    };
  }
}
