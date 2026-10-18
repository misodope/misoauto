import axios from 'axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlatformType } from '@backend/generated/prisma/client';
import { PlatformConnectYouTubeService } from './platform-connect-youtube.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

describe('PlatformConnectYouTubeService', () => {
  const originalEnv = { ...process.env };
  const httpClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  const uploadClient = {
    put: jest.fn(),
    post: jest.fn(),
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
  const blobStorage = {
    downloadStream: jest.fn(),
  };

  const createService = () => {
    (axios.create as jest.Mock)
      .mockReturnValueOnce(httpClient)
      .mockReturnValueOnce(uploadClient);
    return new PlatformConnectYouTubeService(
      socialAccountWriter as never,
      socialAccountReader as never,
      platformReader as never,
      videoPostDraftWriter as never,
      videoPostDraftReader as never,
      videoPostWriter as never,
      blobStorage as never,
    );
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    process.env.YOUTUBE_CLIENT_ID = 'youtube-client-id';
    process.env.YOUTUBE_CLIENT_SECRET = 'youtube-client-secret';
    process.env.YOUTUBE_REDIRECT_URI = 'https://prod.example/redirect';
    process.env.YOUTUBE_REDIRECT_URI_DEV = 'https://dev.example/redirect';
    jest.clearAllMocks();
    platformReader.findByName.mockResolvedValue({
      id: 3,
      name: PlatformType.YOUTUBE,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('requests offline access with the publish scope', () => {
    const service = createService();
    const url = new URL(service.generateAuthUrl('csrf:user'));

    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(url.searchParams.get('scope')?.split(' ')).toEqual(
      expect.arrayContaining([
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
      ]),
    );
    expect(url.searchParams.get('access_type')).toBe('offline');
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
      process.env.YOUTUBE_REDIRECT_URI_DEV = '';
    }
    const service = createService();
    const url = new URL(service.generateAuthUrl());

    expect(url.searchParams.get('redirect_uri')).toBe(expectedRedirectUri);
  });

  it('surfaces Google API error messages', async () => {
    const service = createService();
    httpClient.get.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message:
              'The request cannot be completed because quota is exceeded.',
          },
        },
      },
    });

    await expect(service.getChannelInfo('token')).rejects.toThrow(
      'The request cannot be completed because quota is exceeded.',
    );
  });

  describe('getAccountForUser', () => {
    it('returns a still-valid token without refreshing', async () => {
      const service = createService();
      const account = {
        id: 8,
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        tokenExpiry: new Date(Date.now() + 30 * 60 * 1000),
      };
      socialAccountReader.findByUserAndPlatform.mockResolvedValue([account]);

      await expect(service.getAccountForUser(1)).resolves.toBe(account);
      expect(httpClient.post).not.toHaveBeenCalled();
    });

    it('refreshes and persists an expired token', async () => {
      const service = createService();
      socialAccountReader.findByUserAndPlatform.mockResolvedValue([
        {
          id: 8,
          accessToken: 'expired-token',
          refreshToken: 'refresh-token',
          tokenExpiry: new Date(Date.now() - 1000),
        },
      ]);
      httpClient.post.mockResolvedValueOnce({
        data: { access_token: 'fresh-token', expires_in: 3599 },
      });

      const account = await service.getAccountForUser(1);

      expect(account.accessToken).toBe('fresh-token');
      expect(socialAccountWriter.updateTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 8,
          accessToken: 'fresh-token',
          refreshToken: 'refresh-token',
          tokenExpiry: expect.any(Date),
        }),
      );
    });

    it('throws when no account is connected', async () => {
      const service = createService();
      socialAccountReader.findByUserAndPlatform.mockResolvedValue([]);

      await expect(service.getAccountForUser(1)).rejects.toThrow(
        'No YouTube account connected',
      );
    });
  });

  describe('ownership checks', () => {
    it.each([
      [
        'another user',
        { video: { userId: 99 }, platform: { name: PlatformType.YOUTUBE } },
      ],
      [
        'another platform',
        { video: { userId: 1 }, platform: { name: PlatformType.INSTAGRAM } },
      ],
    ])('hides drafts that belong to %s', async (_, draft) => {
      const service = createService();
      videoPostDraftReader.findByPlatformVideoId.mockResolvedValue({
        platformVideoId: 'yt-video-1',
        ...draft,
      });

      await expect(
        service.getProcessingStatusForUser(1, 'yt-video-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.publishForUser(1, 'yt-video-1', 'public'),
      ).rejects.toThrow(NotFoundException);
      expect(httpClient.get).not.toHaveBeenCalled();
      expect(httpClient.put).not.toHaveBeenCalled();
    });

    it('publishes an owned draft with the account details', async () => {
      const service = createService();
      videoPostDraftReader.findByPlatformVideoId.mockResolvedValue({
        videoId: 10,
        platformVideoId: 'yt-video-1',
        video: { userId: 1 },
        platform: { name: PlatformType.YOUTUBE },
      });
      socialAccountReader.findByUserAndPlatform.mockResolvedValue([
        {
          id: 8,
          platformId: 3,
          accessToken: 'yt-token',
          refreshToken: 'refresh',
          tokenExpiry: new Date(Date.now() + 30 * 60 * 1000),
        },
      ]);
      const publishVideo = jest
        .spyOn(service, 'publishVideo')
        .mockResolvedValue({
          videoId: 'yt-video-1',
          url: 'https://www.youtube.com/watch?v=yt-video-1',
          privacyStatus: 'unlisted',
        });

      await service.publishForUser(1, 'yt-video-1', 'unlisted');

      expect(publishVideo).toHaveBeenCalledWith({
        accessToken: 'yt-token',
        youtubeVideoId: 'yt-video-1',
        privacyStatus: 'unlisted',
        videoId: 10,
        platformId: 3,
        socialAccountId: 8,
      });
    });
  });

  it('rejects invalid YouTube metadata', () => {
    const service = createService();

    expect(() =>
      service.validateYouTubeVideo({ mimeType: 'image/png' }, { title: 'ok' }),
    ).toThrow(BadRequestException);
    expect(() => service.validateYouTubeVideo({}, { title: '   ' })).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.validateYouTubeVideo({}, { title: 'x'.repeat(101) }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.validateYouTubeVideo({}, { title: 'a <b> title' }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.validateYouTubeVideo(
        {},
        { title: 'ok', description: 'é'.repeat(2501) },
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      service.validateYouTubeVideo(
        { mimeType: 'video/mp4' },
        { title: 'ok', description: 'fine' },
      ),
    ).not.toThrow();
  });

  it('uploads privately, sets the thumbnail, and records a draft', async () => {
    const service = createService();
    const videoStream = { destroy: jest.fn() };
    const thumbStream = { destroy: jest.fn() };
    blobStorage.downloadStream
      .mockResolvedValueOnce({
        stream: videoStream,
        contentLength: 1000,
        contentType: 'video/mp4',
      })
      .mockResolvedValueOnce({
        stream: thumbStream,
        contentLength: 500,
        contentType: 'image/jpeg',
      });
    httpClient.post.mockResolvedValueOnce({
      headers: { location: 'https://upload.example/session' },
    });
    uploadClient.put.mockResolvedValueOnce({
      data: {
        id: 'yt-video-1',
        snippet: { title: 'Title' },
        status: { uploadStatus: 'uploaded' },
      },
    });
    uploadClient.post.mockResolvedValueOnce({ data: {} });

    await expect(
      service.initializeVideoUpload({
        accessToken: 'token',
        s3Key: 'videos/10.mp4',
        videoId: 10,
        title: 'Title',
        description: 'Description',
        madeForKids: true,
        thumbnailKey: 'thumbs/10.jpg',
      }),
    ).resolves.toEqual({
      videoId: 'yt-video-1',
      title: 'Title',
      status: 'uploaded',
    });

    expect(httpClient.post.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        status: { privacyStatus: 'private', selfDeclaredMadeForKids: true },
      }),
    );
    expect(uploadClient.post).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=yt-video-1',
      thumbStream,
      expect.anything(),
    );
    expect(videoPostDraftWriter.create).toHaveBeenCalledWith({
      video: { connect: { id: 10 } },
      platform: { connect: { id: 3 } },
      platformVideoId: 'yt-video-1',
    });
  });

  it('does not fail the upload when the thumbnail cannot be set', async () => {
    const service = createService();
    blobStorage.downloadStream
      .mockResolvedValueOnce({
        stream: {},
        contentLength: 1000,
        contentType: 'video/mp4',
      })
      .mockResolvedValueOnce({
        stream: {},
        contentLength: 500,
        contentType: 'image/jpeg',
      });
    httpClient.post.mockResolvedValueOnce({
      headers: { location: 'https://upload.example/session' },
    });
    uploadClient.put.mockResolvedValueOnce({ data: { id: 'yt-video-1' } });
    uploadClient.post.mockRejectedValueOnce({
      response: {
        data: { error: { message: 'Channel is not verified' } },
      },
    });

    await expect(
      service.initializeVideoUpload({
        accessToken: 'token',
        s3Key: 'videos/10.mp4',
        videoId: 10,
        title: 'Title',
        description: '',
        thumbnailKey: 'thumbs/10.jpg',
      }),
    ).resolves.toMatchObject({ videoId: 'yt-video-1' });
    expect(videoPostDraftWriter.create).toHaveBeenCalled();
  });

  it('marks the draft complete when processing succeeds', async () => {
    const service = createService();
    httpClient.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            status: { uploadStatus: 'processed', privacyStatus: 'private' },
            processingDetails: { processingStatus: 'succeeded' },
          },
        ],
      },
    });
    videoPostDraftReader.findByPlatformVideoId.mockResolvedValueOnce({
      id: 9,
      uploadCompletedAt: null,
    });

    await expect(
      service.getVideoProcessingStatus('token', 'yt-video-1'),
    ).resolves.toMatchObject({
      videoId: 'yt-video-1',
      processingStatus: 'succeeded',
    });
    expect(videoPostDraftWriter.markUploadCompleted).toHaveBeenCalledWith(9);
  });

  it('reports rejected uploads as failed with the reason', async () => {
    const service = createService();
    httpClient.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            status: {
              uploadStatus: 'rejected',
              rejectionReason: 'duplicate',
              privacyStatus: 'private',
            },
            processingDetails: { processingStatus: 'processing' },
          },
        ],
      },
    });

    await expect(
      service.getVideoProcessingStatus('token', 'yt-video-1'),
    ).resolves.toMatchObject({
      processingStatus: 'failed',
      failureReason: 'duplicate',
    });
    expect(videoPostDraftWriter.markUploadCompleted).not.toHaveBeenCalled();
  });

  it('publishes by updating privacy while preserving other status fields', async () => {
    const service = createService();
    httpClient.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            status: {
              privacyStatus: 'private',
              embeddable: false,
              license: 'creativeCommon',
              publicStatsViewable: true,
              selfDeclaredMadeForKids: true,
            },
          },
        ],
      },
    });
    httpClient.put.mockResolvedValueOnce({ data: {} });

    await expect(
      service.publishVideo({
        accessToken: 'token',
        youtubeVideoId: 'yt-video-1',
        privacyStatus: 'unlisted',
        videoId: 10,
        platformId: 3,
        socialAccountId: 8,
      }),
    ).resolves.toEqual({
      videoId: 'yt-video-1',
      url: 'https://www.youtube.com/watch?v=yt-video-1',
      privacyStatus: 'unlisted',
    });

    expect(httpClient.put).toHaveBeenCalledWith(
      'https://www.googleapis.com/youtube/v3/videos?part=status',
      {
        id: 'yt-video-1',
        status: expect.objectContaining({
          privacyStatus: 'unlisted',
          embeddable: false,
          license: 'creativeCommon',
          publicStatsViewable: true,
          selfDeclaredMadeForKids: true,
        }),
      },
      expect.anything(),
    );
    expect(videoPostWriter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        platformPostId: 'yt-video-1',
        postUrl: 'https://www.youtube.com/watch?v=yt-video-1',
        status: 'PUBLISHED',
        video: { connect: { id: 10 } },
        platform: { connect: { id: 3 } },
        socialAccount: { connect: { id: 8 } },
        postedAt: expect.any(Date),
      }),
    );
  });
});
