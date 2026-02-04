import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SocialAccountWriter } from '@backend/social-accounts/repository/social-account-writer';
import { SocialAccountReader } from '@backend/social-accounts/repository/social-account-reader';
import { PlatformReader } from '../repository/platform-reader';
import { PlatformType } from '@prisma/client';

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

  constructor(
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly platformReader: PlatformReader,
  ) {
    this.config = {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri:
        process.env.TIKTOK_REDIRECT_URI ||
        'https://darrel-unexcruciating-trent.ngrok-free.dev/api/v1/platform/tiktok/redirect',
      scope: 'user.info.basic,video.list,video.upload,video.publish',
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

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams(params).toString()}`;
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
        new URLSearchParams(tokenData).toString(),
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
        new URLSearchParams(tokenData).toString(),
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

      // Fields available with user.info.basic scope
      // Additional fields require: user.info.profile (bio, profile_deep_link) or user.info.stats (follower/following counts)
      const fields =
        'open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name';

      const response = await this.httpClient.get(
        `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.error && response.data.error.code !== 'ok') {
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

      const tokenData = {
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        token: accessToken,
      };

      await this.httpClient.post(
        'https://open.tiktokapis.com/v2/oauth/revoke/',
        new URLSearchParams(tokenData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully revoked access token');
    } catch (error) {
      this.logger.error('Failed to revoke access token:', error);
      throw new BadRequestException('Failed to revoke TikTok token');
    }
  }

  async saveOAuthAccount(params: {
    userId: number;
    tokenResponse: TikTokTokenResponse;
  }) {
    try {
      this.logger.log('Saving TikTok OAuth account to database');

      // Get TikTok platform
      const platform = await this.platformReader.findByName(
        PlatformType.TIKTOK,
      );
      if (!platform) {
        throw new BadRequestException('TikTok platform not found in database');
      }

      // Calculate token expiry
      const tokenExpiry = new Date(
        Date.now() + params.tokenResponse.expires_in * 1000,
      );

      // Fetch user info to get username
      const userInfo = await this.getUserInfo(
        params.tokenResponse.access_token,
      );

      // Check if account already exists
      const existingAccount =
        await this.socialAccountReader.findByPlatformAndAccountId(
          platform.id,
          params.tokenResponse.open_id,
        );

      let savedAccount;
      if (existingAccount) {
        // Update existing account with new tokens
        this.logger.log(
          `Updating existing TikTok account ${existingAccount.id}`,
        );
        savedAccount = await this.socialAccountWriter.updateTokens({
          id: existingAccount.id,
          accessToken: params.tokenResponse.access_token,
          refreshToken: params.tokenResponse.refresh_token,
          tokenExpiry,
        });
      } else {
        // Create new account
        this.logger.log('Creating new TikTok account');
        savedAccount = await this.socialAccountWriter.create({
          user: { connect: { id: params.userId } },
          platform: { connect: { id: platform.id } },
          accessToken: params.tokenResponse.access_token,
          refreshToken: params.tokenResponse.refresh_token,
          tokenExpiry,
          accountId: params.tokenResponse.open_id,
          username: userInfo.display_name,
        });
      }

      return savedAccount;
    } catch (error) {
      this.logger.error('Failed to save TikTok account:', error);
      throw new BadRequestException('Failed to save TikTok account');
    }
  }
}
