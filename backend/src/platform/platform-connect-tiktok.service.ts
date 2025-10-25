import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { stringify } from 'query-string';

export interface TikTokOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

@Injectable()
export class PlatformConnectTikTokService {
  private readonly logger = new Logger(PlatformConnectTikTokService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: TikTokOAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri: process.env.TIKTOK_REDIRECT_URI || '',
      scope: 'user.info.basic,video.list,video.upload',
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      },
    );

    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('TikTok API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      },
    );
  }

  generateAuthUrl(state?: string): string {
    const params = {
      client_key: this.config.clientId,
      scope: this.config.scope,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: state || Math.random().toString(36).substring(7),
    };

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${stringify(params)}`;
    this.logger.log(`Generated TikTok auth URL: ${authUrl}`);

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      const tokenData = {
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      };

      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        stringify(tokenData),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `TikTok OAuth error: ${response.data.error_description}`,
        );
      }

      this.logger.log('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error);
      throw new BadRequestException('Failed to authenticate with TikTok');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
    try {
      this.logger.log('Refreshing TikTok access token');

      const tokenData = {
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };

      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        stringify(tokenData),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `TikTok token refresh error: ${response.data.error_description}`,
        );
      }

      this.logger.log('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new BadRequestException('Failed to refresh TikTok token');
    }
  }

  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      this.logger.log('Fetching TikTok user information');

      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/user/info/',
        stringify({
          fields:
            'open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count',
        }),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.error) {
        throw new BadRequestException(
          `TikTok API error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched user information');
      return response.data.data.user;
    } catch (error) {
      this.logger.error('Failed to fetch user information:', error);
      throw new BadRequestException('Failed to fetch TikTok user information');
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      this.logger.log('Revoking TikTok access token');

      await this.httpClient.post(
        'https://open.tiktokapis.com/v2/oauth/revoke/',
        stringify({
          token: accessToken,
        }),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log('Successfully revoked access token');
    } catch (error) {
      this.logger.error('Failed to revoke access token:', error);
      throw new BadRequestException('Failed to revoke TikTok token');
    }
  }

  isConfigured(): boolean {
    return !!(
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.redirectUri
    );
  }

  getConfigStatus(): { configured: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!this.config.clientId) missingFields.push('TIKTOK_CLIENT_ID');
    if (!this.config.clientSecret) missingFields.push('TIKTOK_CLIENT_SECRET');
    if (!this.config.redirectUri) missingFields.push('TIKTOK_REDIRECT_URI');

    return {
      configured: missingFields.length === 0,
      missingFields,
    };
  }
}