import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { stringify } from 'query-string';
import { SocialAccountWriter } from '../social-account/repository/social-account-writer';
import { SocialAccountReader } from '../social-account/repository/social-account-reader';
import { PlatformReader } from './repository/platform-reader';
import { PlatformType } from '@prisma/client';

export interface InstagramOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface InstagramTokenResponse {
  access_token: string;
  user_id: number;
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramUserInfo {
  id: string;
  username: string;
  account_type: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL';
  media_count: number;
}

export interface InstagramMedia {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
}

@Injectable()
export class PlatformConnectInstagramService {
  private readonly logger = new Logger(PlatformConnectInstagramService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: InstagramOAuthConfig;

  constructor(
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly platformReader: PlatformReader,
  ) {
    this.config = {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || '',
      scope: 'user_profile,user_media',
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
        this.logger.error('Instagram API Error:', {
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
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: 'code',
      state: state || Math.random().toString(36).substring(7),
    };

    const authUrl = `https://api.instagram.com/oauth/authorize?${stringify(params)}`;
    this.logger.log(`Generated Instagram auth URL: ${authUrl}`);

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<InstagramTokenResponse> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      const tokenData = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code,
      };

      const response = await this.httpClient.post(
        'https://api.instagram.com/oauth/access_token',
        stringify(tokenData),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `Instagram OAuth error: ${response.data.error_description}`,
        );
      }

      this.logger.log('Successfully exchanged code for short-lived token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error);
      throw new BadRequestException('Failed to authenticate with Instagram');
    }
  }

  async exchangeForLongLivedToken(
    shortLivedToken: string,
  ): Promise<InstagramLongLivedTokenResponse> {
    try {
      this.logger.log('Exchanging short-lived token for long-lived token');

      const params = {
        grant_type: 'ig_exchange_token',
        client_secret: this.config.clientSecret,
        access_token: shortLivedToken,
      };

      const response = await this.httpClient.get(
        `https://graph.instagram.com/access_token?${stringify(params)}`,
      );

      if (response.data.error) {
        throw new BadRequestException(
          `Instagram token exchange error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully exchanged for long-lived token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange for long-lived token:', error);
      throw new BadRequestException('Failed to get long-lived Instagram token');
    }
  }

  async refreshLongLivedToken(
    accessToken: string,
  ): Promise<InstagramLongLivedTokenResponse> {
    try {
      this.logger.log('Refreshing Instagram long-lived token');

      const params = {
        grant_type: 'ig_refresh_token',
        access_token: accessToken,
      };

      const response = await this.httpClient.get(
        `https://graph.instagram.com/refresh_access_token?${stringify(params)}`,
      );

      if (response.data.error) {
        throw new BadRequestException(
          `Instagram token refresh error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully refreshed long-lived token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh long-lived token:', error);
      throw new BadRequestException('Failed to refresh Instagram token');
    }
  }

  async saveOAuthAccount(params: {
    userId: number;
    shortLivedToken: string;
    instagramUserId: string;
  }) {
    try {
      this.logger.log('Saving Instagram OAuth account');

      // Exchange short-lived token for long-lived token
      const longLivedTokenResponse = await this.exchangeForLongLivedToken(
        params.shortLivedToken,
      );

      // Get Instagram platform
      const platform = await this.platformReader.findByName(
        PlatformType.INSTAGRAM,
      );
      if (!platform) {
        throw new BadRequestException(
          'Instagram platform not found in database',
        );
      }

      // Calculate token expiry
      const tokenExpiry = new Date(
        Date.now() + longLivedTokenResponse.expires_in * 1000,
      );

      // Fetch user info to get username
      const userInfo = await this.getUserInfo(
        longLivedTokenResponse.access_token,
      );

      // Check if account already exists
      const existingAccount =
        await this.socialAccountReader.findByPlatformAndAccountId(
          platform.id,
          params.instagramUserId,
        );

      let savedAccount;
      if (existingAccount) {
        // Update existing account with new tokens
        this.logger.log(
          `Updating existing Instagram account ${existingAccount.id}`,
        );
        savedAccount = await this.socialAccountWriter.updateTokens({
          id: existingAccount.id,
          accessToken: longLivedTokenResponse.access_token,
          refreshToken: existingAccount.refreshToken || undefined,
          tokenExpiry,
        });
      } else {
        // Create new account
        this.logger.log('Creating new Instagram account');
        savedAccount = await this.socialAccountWriter.create({
          user: { connect: { id: params.userId } },
          platform: { connect: { id: platform.id } },
          accessToken: longLivedTokenResponse.access_token,
          refreshToken: undefined,
          tokenExpiry,
          accountId: params.instagramUserId,
          username: userInfo.username,
        });
      }

      this.logger.log('Successfully saved Instagram account');
      return savedAccount;
    } catch (error) {
      this.logger.error('Failed to save Instagram account:', error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<InstagramUserInfo> {
    try {
      this.logger.log('Fetching Instagram user information');

      const params = {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken,
      };

      const response = await this.httpClient.get(
        `https://graph.instagram.com/me?${stringify(params)}`,
      );

      if (response.data.error) {
        throw new BadRequestException(
          `Instagram API error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched user information');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch user information:', error);
      throw new BadRequestException(
        'Failed to fetch Instagram user information',
      );
    }
  }

  async getUserMedia(
    accessToken: string,
    limit: number = 25,
  ): Promise<InstagramMedia[]> {
    try {
      this.logger.log('Fetching Instagram user media');

      const params = {
        fields:
          'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
        limit: limit.toString(),
        access_token: accessToken,
      };

      const response = await this.httpClient.get(
        `https://graph.instagram.com/me/media?${stringify(params)}`,
      );

      if (response.data.error) {
        throw new BadRequestException(
          `Instagram API error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched user media');
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch user media:', error);
      throw new BadRequestException('Failed to fetch Instagram user media');
    }
  }

  async getMediaById(
    mediaId: string,
    accessToken: string,
  ): Promise<InstagramMedia> {
    try {
      this.logger.log(`Fetching Instagram media details for ID: ${mediaId}`);

      const params = {
        fields:
          'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
        access_token: accessToken,
      };

      const response = await this.httpClient.get(
        `https://graph.instagram.com/${mediaId}?${stringify(params)}`,
      );

      if (response.data.error) {
        throw new BadRequestException(
          `Instagram API error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched media details');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch media details:', error);
      throw new BadRequestException('Failed to fetch Instagram media details');
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken);
      return true;
    } catch (error) {
      this.logger.warn(
        'Instagram token validation failed:',
        (error as Error).message,
      );
      return false;
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

    if (!this.config.clientId) missingFields.push('INSTAGRAM_CLIENT_ID');
    if (!this.config.clientSecret)
      missingFields.push('INSTAGRAM_CLIENT_SECRET');
    if (!this.config.redirectUri) missingFields.push('INSTAGRAM_REDIRECT_URI');

    return {
      configured: missingFields.length === 0,
      missingFields,
    };
  }
}
