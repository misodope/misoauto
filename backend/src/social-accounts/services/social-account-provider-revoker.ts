import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PlatformType } from '@backend/generated/prisma/client';

export type RevokeResult =
  | { status: 'revoked' | 'already_revoked' | 'unsupported' }
  | { status: 'failed'; reason: 'provider_error' | 'timeout' };

@Injectable()
export class SocialAccountProviderRevoker {
  private readonly logger = new Logger(SocialAccountProviderRevoker.name);

  async revoke(
    platform: PlatformType,
    accessToken: string | null,
    refreshToken: string | null,
  ): Promise<RevokeResult> {
    if (!accessToken && !refreshToken) {
      return { status: 'already_revoked' };
    }

    try {
      switch (platform) {
        case PlatformType.TIKTOK:
          await axios.post(
            'https://open.tiktokapis.com/v2/oauth/revoke/',
            new URLSearchParams({
              client_key: process.env.TIKTOK_CLIENT_ID || '',
              client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
              token: accessToken || refreshToken || '',
            }).toString(),
            { timeout: 10_000 },
          );
          return { status: 'revoked' };
        case PlatformType.YOUTUBE:
          await axios.post(
            'https://oauth2.googleapis.com/revoke',
            new URLSearchParams({
              token: accessToken || refreshToken || '',
            }).toString(),
            { timeout: 10_000 },
          );
          return { status: 'revoked' };
        case PlatformType.INSTAGRAM:
          // Instagram Login's deauthorization contract depends on the Meta
          // product configured for the deployment. Local disabling and
          // credential clearing remain authoritative until that adapter is
          // configured explicitly.
          return { status: 'unsupported' };
        case PlatformType.FACEBOOK:
          return { status: 'unsupported' };
        default:
          return { status: 'unsupported' };
      }
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      if (status === 400 || status === 401 || status === 404) {
        return { status: 'already_revoked' };
      }
      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
      this.logger.warn(
        `Provider revoke failed for ${platform}: ${isTimeout ? 'timeout' : 'provider error'}`,
      );
      return {
        status: 'failed',
        reason: isTimeout ? 'timeout' : 'provider_error',
      };
    }
  }
}
