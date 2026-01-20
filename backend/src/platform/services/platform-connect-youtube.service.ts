import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { stringify } from 'query-string';
import { SocialAccountWriter } from '../../social-accounts/repository/social-account-writer';
import { SocialAccountReader } from '../../social-accounts/repository/social-account-reader';
import { PlatformReader } from '../repository/platform-reader';
import { PlatformType } from '@prisma/client';

export interface YouTubeOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface YouTubeTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface YouTubeChannelInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  contentDetails: {
    relatedPlaylists: {
      uploads: string;
    };
  };
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelId: string;
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
  };
}

@Injectable()
export class PlatformConnectYouTubeService {
  private readonly logger = new Logger(PlatformConnectYouTubeService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: YouTubeOAuthConfig;

  constructor(
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly platformReader: PlatformReader,
  ) {
    this.config = {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || '',
      scope:
        'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
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
        this.logger.error('YouTube API Error:', {
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
      access_type: 'offline',
      prompt: 'consent',
      state: state || Math.random().toString(36).substring(7),
    };

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${stringify(params)}`;
    this.logger.log(`Generated YouTube auth URL: ${authUrl}`);

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<YouTubeTokenResponse> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      const tokenData = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      };

      const response = await this.httpClient.post(
        'https://oauth2.googleapis.com/token',
        stringify(tokenData),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `YouTube OAuth error: ${response.data.error_description}`,
        );
      }

      this.logger.log('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error);
      throw new BadRequestException('Failed to authenticate with YouTube');
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<YouTubeTokenResponse> {
    try {
      this.logger.log('Refreshing YouTube access token');

      const tokenData = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      };

      const response = await this.httpClient.post(
        'https://oauth2.googleapis.com/token',
        stringify(tokenData),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `YouTube token refresh error: ${response.data.error_description}`,
        );
      }

      this.logger.log('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new BadRequestException('Failed to refresh YouTube token');
    }
  }

  async saveOAuthAccount(params: {
    userId: number;
    tokenResponse: YouTubeTokenResponse;
  }) {
    try {
      this.logger.log('Saving YouTube OAuth account');

      // Get YouTube platform
      const platform = await this.platformReader.findByName(
        PlatformType.YOUTUBE,
      );
      if (!platform) {
        throw new BadRequestException('YouTube platform not found in database');
      }

      // Calculate token expiry
      const tokenExpiry = new Date(
        Date.now() + params.tokenResponse.expires_in * 1000,
      );

      // Fetch channel info to get channel ID and username
      const channelInfo = await this.getChannelInfo(
        params.tokenResponse.access_token,
      );

      // Check if account already exists
      const existingAccount =
        await this.socialAccountReader.findByPlatformAndAccountId(
          platform.id,
          channelInfo.id,
        );

      let savedAccount;
      if (existingAccount) {
        // Update existing account with new tokens
        this.logger.log(
          `Updating existing YouTube account ${existingAccount.id}`,
        );

        // YouTube may return a new refresh token, use it if provided
        const newRefreshToken =
          params.tokenResponse.refresh_token ||
          existingAccount.refreshToken ||
          undefined;

        savedAccount = await this.socialAccountWriter.updateTokens({
          id: existingAccount.id,
          accessToken: params.tokenResponse.access_token,
          refreshToken: newRefreshToken,
          tokenExpiry,
        });
      } else {
        // Create new account
        this.logger.log('Creating new YouTube account');
        savedAccount = await this.socialAccountWriter.create({
          user: { connect: { id: params.userId } },
          platform: { connect: { id: platform.id } },
          accessToken: params.tokenResponse.access_token,
          refreshToken: params.tokenResponse.refresh_token || undefined,
          tokenExpiry,
          accountId: channelInfo.id,
          username: channelInfo.snippet.title,
        });
      }

      this.logger.log('Successfully saved YouTube account');
      return savedAccount;
    } catch (error) {
      this.logger.error('Failed to save YouTube account:', error);
      throw error;
    }
  }

  async getChannelInfo(accessToken: string): Promise<YouTubeChannelInfo> {
    try {
      this.logger.log('Fetching YouTube channel information');

      const params = {
        part: 'snippet,statistics,contentDetails',
        mine: 'true',
      };

      const response = await this.httpClient.get(
        `https://www.googleapis.com/youtube/v3/channels?${stringify(params)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${response.data.error.message}`,
        );
      }

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException(
          'No YouTube channel found for this account',
        );
      }

      this.logger.log('Successfully fetched channel information');
      return response.data.items[0];
    } catch (error) {
      this.logger.error('Failed to fetch channel information:', error);
      throw new BadRequestException(
        'Failed to fetch YouTube channel information',
      );
    }
  }

  async getChannelVideos(
    accessToken: string,
    maxResults: number = 25,
  ): Promise<YouTubeVideo[]> {
    try {
      this.logger.log('Fetching YouTube channel videos');

      const channelInfo = await this.getChannelInfo(accessToken);
      const uploadsPlaylistId =
        channelInfo.contentDetails.relatedPlaylists.uploads;

      const playlistParams = {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults.toString(),
      };

      const playlistResponse = await this.httpClient.get(
        `https://www.googleapis.com/youtube/v3/playlistItems?${stringify(playlistParams)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (playlistResponse.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${playlistResponse.data.error.message}`,
        );
      }

      const videoIds = playlistResponse.data.items.map(
        (item: any) => item.snippet.resourceId.videoId,
      );

      if (videoIds.length === 0) {
        return [];
      }

      const videoParams = {
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
      };

      const videosResponse = await this.httpClient.get(
        `https://www.googleapis.com/youtube/v3/videos?${stringify(videoParams)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (videosResponse.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${videosResponse.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched channel videos');
      return videosResponse.data.items || [];
    } catch (error) {
      this.logger.error('Failed to fetch channel videos:', error);
      throw new BadRequestException('Failed to fetch YouTube channel videos');
    }
  }

  async getVideoById(
    videoId: string,
    accessToken: string,
  ): Promise<YouTubeVideo> {
    try {
      this.logger.log(`Fetching YouTube video details for ID: ${videoId}`);

      const params = {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
      };

      const response = await this.httpClient.get(
        `https://www.googleapis.com/youtube/v3/videos?${stringify(params)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${response.data.error.message}`,
        );
      }

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException('Video not found');
      }

      this.logger.log('Successfully fetched video details');
      return response.data.items[0];
    } catch (error) {
      this.logger.error('Failed to fetch video details:', error);
      throw new BadRequestException('Failed to fetch YouTube video details');
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      this.logger.log('Revoking YouTube access token');

      await this.httpClient.post(
        `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      );

      this.logger.log('Successfully revoked access token');
    } catch (error) {
      this.logger.error('Failed to revoke access token:', error);
      throw new BadRequestException('Failed to revoke YouTube token');
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getChannelInfo(accessToken);
      return true;
    } catch (error) {
      this.logger.warn(
        'YouTube token validation failed:',
        (error as Error).message,
      );
      return false;
    }
  }
}
