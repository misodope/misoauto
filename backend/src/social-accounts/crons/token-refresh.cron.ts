import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SocialAccountReader } from '@backend/social-accounts/repository/social-account-reader';
import { SocialAccountWriter } from '@backend/social-accounts/repository/social-account-writer';
import { PlatformConnectTikTokService } from '@backend/platform/services/platform-connect-tiktok.service';
import { PlatformConnectYouTubeService } from '@backend/platform/services/platform-connect-youtube.service';
import { PlatformConnectInstagramService } from '@backend/platform/services/platform-connect-instagram.service';
import { PlatformType } from '@backend/generated/prisma/client';

const TIKTOK_REFRESH_WINDOW_MS = 18 * 60 * 60 * 1000;
const YOUTUBE_REFRESH_WINDOW_MS = 45 * 60 * 1000;
const INSTAGRAM_REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TokenRefreshCron {
  private readonly logger = new Logger(TokenRefreshCron.name);

  constructor(
    private readonly socialAccountReader: SocialAccountReader,
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly tiktokService: PlatformConnectTikTokService,
    private readonly youtubeService: PlatformConnectYouTubeService,
    private readonly instagramService: PlatformConnectInstagramService,
  ) {}

  /**
   * Refresh expired social media tokens
   * Runs every 30 minutes to keep short-lived access tokens fresh
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'refresh-expired-tokens',
    timeZone: 'America/New_York',
  })
  async handleTokenRefresh() {
    this.logger.log('Running token refresh job');

    try {
      const now = Date.now();
      const soonToExpireAccounts = await this.socialAccountReader.findAll({
        where: {
          OR: [
            {
              platform: { name: PlatformType.TIKTOK },
              refreshToken: { not: null },
              tokenExpiry: {
                lte: new Date(now + TIKTOK_REFRESH_WINDOW_MS),
              },
            },
            {
              platform: { name: PlatformType.YOUTUBE },
              refreshToken: { not: null },
              tokenExpiry: {
                lte: new Date(now + YOUTUBE_REFRESH_WINDOW_MS),
              },
            },
            {
              platform: { name: PlatformType.INSTAGRAM },
              tokenExpiry: {
                lte: new Date(now + INSTAGRAM_REFRESH_WINDOW_MS),
                gt: new Date(now),
              },
            },
          ],
        },
      });

      this.logger.log(
        `Found ${soonToExpireAccounts.length} tokens to refresh (TikTok within 18 hours, YouTube within 45 minutes, or Instagram within 7 days)`,
      );

      for (const account of soonToExpireAccounts) {
        try {
          await this.refreshAccountToken(account);
        } catch (error) {
          this.logger.error(
            `Failed to refresh token for account ${account.id} (Platform: ${account.platform.name})`,
            error,
          );
          // Continue with next account even if one fails
        }
      }

      this.logger.log('Token refresh job completed');
    } catch (error) {
      this.logger.error('Failed to refresh tokens', error);
    }
  }

  private async refreshAccountToken(account: any) {
    this.logger.log(
      `Refreshing token for account ${account.id} (Platform: ${account.platform.name})`,
    );

    const platformName = account.platform.name as PlatformType;

    if (!account.refreshToken && platformName !== PlatformType.INSTAGRAM) {
      this.logger.warn(
        `Account ${account.id} has no refresh token and is not Instagram, skipping`,
      );
      return;
    }

    switch (platformName) {
      case PlatformType.TIKTOK:
        await this.refreshTikTokToken(account);
        break;
      case PlatformType.YOUTUBE:
        await this.refreshYouTubeToken(account);
        break;
      case PlatformType.INSTAGRAM:
        await this.refreshInstagramToken(account);
        break;
      case PlatformType.FACEBOOK:
        this.logger.warn('Facebook token refresh not implemented yet');
        break;
      default:
        this.logger.warn(`Unknown platform: ${platformName}`);
    }
  }

  private async refreshTikTokToken(account: any) {
    const tokenResponse = await this.tiktokService.refreshAccessToken(
      account.refreshToken,
    );

    // TikTok tokens expire in 24 hours (86400 seconds)
    const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // IMPORTANT: The refresh token may change! Always use the new one
    const newRefreshToken = tokenResponse.refresh_token || account.refreshToken;

    await this.socialAccountWriter.updateTokens({
      id: account.id,
      accessToken: tokenResponse.access_token,
      refreshToken: newRefreshToken,
      tokenExpiry,
    });

    this.logger.log(
      `Successfully refreshed TikTok token for account ${account.id}. Token expires at ${tokenExpiry.toISOString()}`,
    );
  }

  private async refreshYouTubeToken(account: any) {
    const tokenResponse = await this.youtubeService.refreshAccessToken(
      account.refreshToken,
    );

    const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // YouTube may return a new refresh token, use it if provided
    const newRefreshToken = tokenResponse.refresh_token || account.refreshToken;

    await this.socialAccountWriter.updateTokens({
      id: account.id,
      accessToken: tokenResponse.access_token,
      refreshToken: newRefreshToken,
      tokenExpiry,
    });

    this.logger.log(
      `Successfully refreshed YouTube token for account ${account.id}. Token expires at ${tokenExpiry.toISOString()}`,
    );
  }

  private async refreshInstagramToken(account: any) {
    const tokenResponse = await this.instagramService.refreshLongLivedToken(
      account.accessToken,
    );

    const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Instagram doesn't rotate refresh tokens, but we keep the same pattern
    await this.socialAccountWriter.updateTokens({
      id: account.id,
      accessToken: tokenResponse.access_token,
      refreshToken: account.refreshToken,
      tokenExpiry,
    });

    this.logger.log(
      `Successfully refreshed Instagram token for account ${account.id}. Token expires at ${tokenExpiry.toISOString()}`,
    );
  }
}
