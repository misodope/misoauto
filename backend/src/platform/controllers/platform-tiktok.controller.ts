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

export interface RefreshTokenRequest {
  refreshToken: string;
}

@Controller('platform/tiktok')
export class TikTokController {
  private readonly logger = new Logger(TikTokController.name);

  constructor(private readonly tiktokService: PlatformConnectTikTokService) {}

  @Get('oauth')
  @UseGuards(JwtAuthGuard)
  initiateOAuth(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    this.logger.log(
      `Initiating TikTok OAuth flow for user ${user.sub} (${user.email})`,
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
    const authUrl = this.tiktokService.generateAuthUrl(csrfState);
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
    console.group('REQUEST COOKIS', req.cookies);
    // Extract CSRF state and userId from cookies
    const csrfState = req.cookies?.csrfState;
    console.log('csrfState', csrfState);
    const userId = req.cookies?.oauthUserId;
    console.log('userId', userId);

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

      // Clear OAuth cookies
      res.clearCookie('csrfState');
      res.clearCookie('oauthUserId');

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
}
