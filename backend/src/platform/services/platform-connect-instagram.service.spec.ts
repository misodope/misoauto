import axios from 'axios';
import { BadRequestException } from '@nestjs/common';
import { PlatformType } from '@backend/generated/prisma/client';
import { PlatformConnectInstagramService } from './platform-connect-instagram.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

describe('PlatformConnectInstagramService', () => {
  const originalEnv = { ...process.env };
  const httpClient = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  const socialAccountWriter = {
    create: jest.fn(),
    updateTokens: jest.fn(),
  };
  const socialAccountReader = {
    findByPlatformAndAccountId: jest.fn(),
    findByUserAndPlatform: jest.fn(),
  };
  const platformReader = {
    findByName: jest.fn(),
  };
  const videoPostDraftWriter = {
    create: jest.fn(),
    markUploadCompleted: jest.fn(),
  };
  const videoPostDraftReader = {
    findByPlatformVideoId: jest.fn(),
  };
  const videoPostWriter = {
    create: jest.fn(),
  };

  const createService = () => {
    (axios.create as jest.Mock).mockReturnValue(httpClient);
    return new PlatformConnectInstagramService(
      socialAccountWriter as never,
      socialAccountReader as never,
      platformReader as never,
      videoPostDraftWriter as never,
      videoPostDraftReader as never,
      videoPostWriter as never,
    );
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    process.env.INSTAGRAM_CLIENT_ID = 'instagram-client-id';
    process.env.INSTAGRAM_CLIENT_SECRET = 'instagram-client-secret';
    process.env.INSTAGRAM_REDIRECT_URI = 'https://prod.example/redirect';
    process.env.INSTAGRAM_REDIRECT_URI_DEV = 'https://dev.example/redirect';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses the Instagram Login authorize host and business scopes', () => {
    const service = createService();
    const url = new URL(service.generateAuthUrl('csrf:user'));

    expect(url.origin + url.pathname).toBe(
      'https://www.instagram.com/oauth/authorize',
    );
    expect(url.searchParams.get('scope')).toBe(
      'instagram_business_basic,instagram_business_content_publish',
    );
    expect(url.searchParams.get('state')).toBe('csrf:user');
  });

  it.each([
    [
      'development uses the dev redirect URI',
      'development',
      'https://dev.example/redirect',
    ],
    [
      'development falls back to the production redirect URI',
      'test',
      'https://prod.example/redirect',
    ],
    [
      'production ignores the dev redirect URI',
      'production',
      'https://prod.example/redirect',
    ],
  ])('%s', (_, nodeEnv, expectedRedirectUri) => {
    process.env.NODE_ENV = nodeEnv;
    if (nodeEnv === 'test') {
      process.env.INSTAGRAM_REDIRECT_URI_DEV = '';
    }
    const service = createService();
    const url = new URL(service.generateAuthUrl());

    expect(url.searchParams.get('redirect_uri')).toBe(expectedRedirectUri);
  });

  it('parses a direct token response and strips the trailing #_ from the code', async () => {
    const service = createService();
    httpClient.post.mockResolvedValueOnce({
      data: { access_token: 'short-token' },
    });

    await expect(service.exchangeCodeForToken('auth-code#_')).resolves.toEqual({
      access_token: 'short-token',
    });

    const body = httpClient.post.mock.calls[0][1] as string;
    expect(body).toContain('code=auth-code');
    expect(body).not.toContain('%23_');
  });

  it('parses the data-array token response shape', async () => {
    const service = createService();
    httpClient.post.mockResolvedValueOnce({
      data: { data: [{ access_token: 'array-token' }] },
    });

    await expect(service.exchangeCodeForToken('auth-code')).resolves.toEqual({
      access_token: 'array-token',
    });
  });

  it('preserves the full Instagram user ID when saving an account', async () => {
    const service = createService();
    const platform = { id: 7, name: PlatformType.INSTAGRAM };
    platformReader.findByName.mockResolvedValue(platform);
    socialAccountReader.findByPlatformAndAccountId.mockResolvedValue(null);
    socialAccountWriter.create.mockResolvedValue({ id: 42 });
    jest.spyOn(service, 'exchangeForLongLivedToken').mockResolvedValue({
      access_token: 'long-lived-token',
      token_type: 'bearer',
      expires_in: 5_183_944,
    });
    jest.spyOn(service, 'getUserInfo').mockResolvedValue({
      user_id: '17841400000000000001',
      username: 'tester',
      account_type: 'CREATOR',
    });

    await service.saveOAuthAccount({
      userId: 123,
      shortLivedToken: 'short-lived-token',
    });

    expect(socialAccountReader.findByPlatformAndAccountId).toHaveBeenCalledWith(
      7,
      '17841400000000000001',
    );
    expect(socialAccountWriter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: '17841400000000000001',
        refreshToken: undefined,
      }),
    );
  });

  it('rejects invalid Reel videos and captions', () => {
    const service = createService();

    expect(() => service.validateReelVideo({ mimeType: 'video/webm' })).toThrow(
      BadRequestException,
    );
    expect(() => service.validateReelVideo({ duration: 2 })).toThrow(
      BadRequestException,
    );
    expect(() => service.validateReelVideo({ duration: 901 })).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.validateReelVideo({ fileSize: 300 * 1024 * 1024 + 1 }),
    ).toThrow(BadRequestException);
    expect(() => service.validateReelVideo({}, 'x'.repeat(2201))).toThrow(
      BadRequestException,
    );
  });

  it('creates a Reel container with an optional cover URL', async () => {
    const service = createService();
    httpClient.post.mockResolvedValueOnce({ data: { id: 'container-1' } });
    videoPostDraftWriter.create.mockResolvedValueOnce({ id: 1 });

    await expect(
      service.createReelContainer({
        accessToken: 'token',
        igUserId: '17841400000000000001',
        videoUrl: 'https://cdn.example/video.mp4',
        caption: 'Caption',
        shareToFeed: true,
        videoId: 10,
        platformId: 7,
      }),
    ).resolves.toEqual({ containerId: 'container-1' });

    expect(httpClient.post).toHaveBeenCalledWith(
      'https://graph.instagram.com/v25.0/17841400000000000001/media',
      expect.not.objectContaining({ cover_url: expect.anything() }),
    );

    httpClient.post.mockResolvedValueOnce({ data: { id: 'container-2' } });
    await service.createReelContainer({
      accessToken: 'token',
      igUserId: 'ig-user',
      videoUrl: 'https://cdn.example/video.mp4',
      caption: 'Caption',
      coverUrl: 'https://cdn.example/cover.jpg',
      shareToFeed: false,
      videoId: 10,
      platformId: 7,
    });

    expect(httpClient.post).toHaveBeenLastCalledWith(
      'https://graph.instagram.com/v25.0/ig-user/media',
      expect.objectContaining({ cover_url: 'https://cdn.example/cover.jpg' }),
    );
  });

  it('maps container status and marks a finished draft complete', async () => {
    const service = createService();
    httpClient.get.mockResolvedValueOnce({
      data: { status_code: 'FINISHED', status: 'Ready to publish' },
    });
    videoPostDraftReader.findByPlatformVideoId.mockResolvedValueOnce({
      id: 9,
      uploadCompletedAt: null,
    });

    await expect(
      service.getContainerStatus('token', 'container-1'),
    ).resolves.toEqual({
      containerId: 'container-1',
      statusCode: 'FINISHED',
      status: 'Ready to publish',
    });
    expect(videoPostDraftWriter.markUploadCompleted).toHaveBeenCalledWith(9);

    httpClient.get.mockResolvedValueOnce({
      data: { status_code: 'ERROR', status: 'Unsupported video' },
    });
    await expect(
      service.getContainerStatus('token', 'container-2'),
    ).resolves.toMatchObject({ statusCode: 'ERROR' });
  });

  it('publishes a Reel and creates a published VideoPost', async () => {
    const service = createService();
    httpClient.post.mockResolvedValueOnce({ data: { id: 'media-1' } });
    httpClient.get.mockResolvedValueOnce({
      data: { permalink: 'https://instagram.com/reel/media-1' },
    });
    videoPostWriter.create.mockResolvedValueOnce({ id: 12 });

    await expect(
      service.publishContainer({
        accessToken: 'token',
        igUserId: 'ig-user',
        containerId: 'container-1',
        videoId: 10,
        platformId: 7,
        socialAccountId: 8,
      }),
    ).resolves.toEqual({
      mediaId: 'media-1',
      permalink: 'https://instagram.com/reel/media-1',
    });

    expect(videoPostWriter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        platformPostId: 'media-1',
        postUrl: 'https://instagram.com/reel/media-1',
        status: 'PUBLISHED',
        video: { connect: { id: 10 } },
        platform: { connect: { id: 7 } },
        socialAccount: { connect: { id: 8 } },
        postedAt: expect.any(Date),
      }),
    );
  });
});
