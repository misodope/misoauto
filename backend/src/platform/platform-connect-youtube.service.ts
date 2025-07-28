import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { stringify } from 'query-string';

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

  constructor() {
    this.config = {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri: process.env.YOUTUBE_REDIRECT_URI || '',
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Request interceptor for logging
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

    // Response interceptor for error handling
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

  /**
   * Generate OAuth authorization URL for YouTube
   */
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

  /**
   * Exchange authorization code for access token
   */
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
        throw new BadRequestException(`YouTube OAuth error: ${response.data.error_description}`);
      }

      this.logger.log('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error);
      throw new BadRequestException('Failed to authenticate with YouTube');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<YouTubeTokenResponse> {
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
        throw new BadRequestException(`YouTube token refresh error: ${response.data.error_description}`);
      }

      this.logger.log('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new BadRequestException('Failed to refresh YouTube token');
    }
  }

  /**
   * Get user's channel information
   */
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
        throw new BadRequestException(`YouTube API error: ${response.data.error.message}`);
      }

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException('No YouTube channel found for this account');
      }

      this.logger.log('Successfully fetched channel information');
      return response.data.items[0];
    } catch (error) {
      this.logger.error('Failed to fetch channel information:', error);
      throw new BadRequestException('Failed to fetch YouTube channel information');
    }
  }

  /**
   * Get channel's uploaded videos
   */
  async getChannelVideos(accessToken: string, maxResults: number = 25): Promise<YouTubeVideo[]> {
    try {
      this.logger.log('Fetching YouTube channel videos');

      // First, get the channel's uploads playlist ID
      const channelInfo = await this.getChannelInfo(accessToken);
      const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;

      // Get playlist items (videos)
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
        throw new BadRequestException(`YouTube API error: ${playlistResponse.data.error.message}`);
      }

      // Get detailed video information
      const videoIds = playlistResponse.data.items.map((item: any) => item.snippet.resourceId.videoId);
      
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
        throw new BadRequestException(`YouTube API error: ${videosResponse.data.error.message}`);
      }

      this.logger.log('Successfully fetched channel videos');
      return videosResponse.data.items || [];
    } catch (error) {
      this.logger.error('Failed to fetch channel videos:', error);
      throw new BadRequestException('Failed to fetch YouTube channel videos');
    }
  }

  /**
   * Get video details by ID
   */
  async getVideoById(videoId: string, accessToken: string): Promise<YouTubeVideo> {
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
        throw new BadRequestException(`YouTube API error: ${response.data.error.message}`);
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

  /**
   * Revoke access token
   */
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

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getChannelInfo(accessToken);
      return true;
    } catch (error) {
      this.logger.warn('YouTube token validation failed:', (error as Error).message);
      return false;
    }
  }

  /**
   * Validate if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.redirectUri
    );
  }

  /**
   * Get service configuration status
   */
  getConfigStatus(): { configured: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!this.config.clientId) missingFields.push('YOUTUBE_CLIENT_ID');
    if (!this.config.clientSecret) missingFields.push('YOUTUBE_CLIENT_SECRET');
    if (!this.config.redirectUri) missingFields.push('YOUTUBE_REDIRECT_URI');

    return {
      configured: missingFields.length === 0,
      missingFields,
    };
  }
}
