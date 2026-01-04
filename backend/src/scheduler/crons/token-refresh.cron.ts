import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SocialAccountReader } from '@backend/social-account/repository/social-account-reader';
import { SocialAccountWriter } from '@backend/social-account/repository/social-account-writer';
import { PlatformConnectTikTokService } from '@backend/platform/platform-connect-tiktok.service';
import { PlatformConnectYouTubeService } from '@backend/platform/platform-connect-youtube.service';
import { PlatformConnectInstagramService } from '@backend/platform/platform-connect-instagram.service';
import { PlatformType } from '@prisma/client';

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
   * Runs every 12 hours to ensure tokens are refreshed before expiry
   */
  @Cron(CronExpression.EVERY_12_HOURS, {
    name: 'refresh-expired-tokens',
    timeZone: 'America/New_York',
  })
  async handleTokenRefresh() {
    this.logger.log('Running token refresh job');

    try {
      // Find tokens that will expire in the next 6 hours
      const soonToExpireAccounts = await this.socialAccountReader.findAll({
        where: {
          tokenExpiry: {
            lte: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
          },
          refreshToken: {
            not: null,
          },
        },
      });

      this.logger.log(
        `Found ${soonToExpireAccounts.length} tokens to refresh (expiring within 6 hours)`,
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

    if (!account.refreshToken) {
      this.logger.warn(`Account ${account.id} has no refresh token, skipping`);
      return;
    }

    const platformName = account.platform.name as PlatformType;

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
