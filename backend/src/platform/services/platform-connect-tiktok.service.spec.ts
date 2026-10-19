import axios from 'axios';
import { PlatformConnectTikTokService } from './platform-connect-tiktok.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

describe('PlatformConnectTikTokService', () => {
  const originalEnv = { ...process.env };
  const httpClient = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  const socialAccountReader = {
    findOne: jest.fn(),
    findByUserAndPlatform: jest.fn(),
  };
  const platformReader = { findByName: jest.fn() };
  const videoPostWriter = { create: jest.fn(), update: jest.fn() };
  const videoPostReader = { findByPlatformPostId: jest.fn() };

  const createService = () => {
    (axios.create as jest.Mock).mockReturnValue(httpClient);

    return new PlatformConnectTikTokService(
      {} as never,
      socialAccountReader as never,
      platformReader as never,
      {} as never,
      videoPostWriter as never,
      videoPostReader as never,
    );
  };

  const creatorInfo = {
    creator_avatar_url: 'https://example.com/a.jpg',
    creator_username: 'miso',
    creator_nickname: 'Miso',
    privacy_level_options: ['PUBLIC_TO_EVERYONE', 'SELF_ONLY'],
    comment_disabled: false,
    duet_disabled: true,
    stitch_disabled: false,
    max_video_post_duration_sec: 600,
  };

  const account = {
    id: 7,
    userId: 1,
    platformId: 3,
    accessToken: 'account-token',
  };

  const directPostParams = {
    account: account as never,
    videoId: 42,
    videoUrl: 'https://cdn.example/video.mp4',
    videoDurationSec: 30,
    caption: 'Hello #miso',
    options: {
      privacyLevel: 'PUBLIC_TO_EVERYONE' as const,
      allowComment: true,
      allowDuet: true,
      allowStitch: false,
      isAigc: false,
      brandOrganic: false,
      brandContent: false,
    },
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    process.env.TIKTOK_CLIENT_ID = 'tiktok-client-id';
    process.env.TIKTOK_CLIENT_SECRET = 'tiktok-client-secret';
    process.env.TIKTOK_REDIRECT_URI = 'https://prod.example/redirect';
    process.env.TIKTOK_REDIRECT_URI_DEV = 'https://dev.example/redirect';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
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
      process.env.TIKTOK_REDIRECT_URI_DEV = '';
    }

    const service = createService();
    const url = new URL(service.generateAuthUrl());

    expect(url.searchParams.get('redirect_uri')).toBe(expectedRedirectUri);
  });

  it('requests TikTok audience statistics with user info', async () => {
    const service = createService();
    httpClient.get.mockResolvedValueOnce({
      data: {
        data: { user: { follower_count: 123 } },
      },
    });

    await service.getUserInfo('access-token');

    const url = new URL(httpClient.get.mock.calls[0][0]);
    expect(url.searchParams.get('fields')).toContain('follower_count');
    expect(url.searchParams.get('fields')).toContain('likes_count');
    expect(url.searchParams.get('fields')).toContain('video_count');
  });

  describe('getAccountForUser', () => {
    beforeEach(() => {
      platformReader.findByName.mockResolvedValue({ id: 3 });
    });

    it('returns the selected account', async () => {
      socialAccountReader.findOne.mockResolvedValue(account);
      await expect(createService().getAccountForUser(1, 7)).resolves.toBe(
        account,
      );
    });

    it.each([
      ['another user', { ...account, userId: 2 }],
      ['another platform', { ...account, platformId: 4 }],
      ['a missing account', null],
    ])('rejects %s', async (_, found) => {
      socialAccountReader.findOne.mockResolvedValue(found);
      await expect(createService().getAccountForUser(1, 7)).rejects.toThrow(
        'TikTok account not found',
      );
    });
  });

  describe('initializeDirectPost', () => {
    it('checks creator info, posts, and records a PUBLISHING post', async () => {
      httpClient.post
        .mockResolvedValueOnce({
          data: { data: creatorInfo, error: { code: 'ok' } },
        })
        .mockResolvedValueOnce({
          data: { data: { publish_id: 'pub-1' }, error: { code: 'ok' } },
        });
      videoPostWriter.create.mockResolvedValue({ id: 99 });

      const result =
        await createService().initializeDirectPost(directPostParams);

      expect(result).toEqual({ publishId: 'pub-1', videoPostId: 99 });
      const [url, body, config] = httpClient.post.mock.calls[1];
      expect(url).toBe(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
      );
      expect(body).toEqual({
        post_info: {
          title: 'Hello #miso',
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_comment: false,
          // Turned off in the creator's TikTok settings.
          disable_duet: true,
          disable_stitch: true,
          brand_content_toggle: false,
          brand_organic_toggle: false,
          is_aigc: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: 'https://cdn.example/video.mp4',
        },
      });
      expect(config.headers.Authorization).toBe('Bearer account-token');
      expect(videoPostWriter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          platformPostId: 'pub-1',
          status: 'PUBLISHING',
          uploadMode: 'DIRECT',
          caption: 'Hello #miso',
          socialAccount: { connect: { id: 7 } },
        }),
      );
    });

    it('does not post when the privacy level is not offered', async () => {
      httpClient.post.mockResolvedValueOnce({
        data: { data: creatorInfo, error: { code: 'ok' } },
      });

      await expect(
        createService().initializeDirectPost({
          ...directPostParams,
          options: {
            ...directPostParams.options,
            privacyLevel: 'FOLLOWER_OF_CREATOR',
          },
        }),
      ).rejects.toThrow('That visibility option is not available');
      expect(httpClient.post).toHaveBeenCalledTimes(1);
      expect(videoPostWriter.create).not.toHaveBeenCalled();
    });

    it('surfaces posting caps from creator info', async () => {
      httpClient.post.mockResolvedValueOnce({
        data: { data: {}, error: { code: 'spam_risk_too_many_posts' } },
      });

      await expect(
        createService().initializeDirectPost(directPostParams),
      ).rejects.toThrow("reached TikTok's daily posting limit");
      expect(httpClient.post).toHaveBeenCalledTimes(1);
    });

    it('maps init errors and records nothing', async () => {
      httpClient.post
        .mockResolvedValueOnce({
          data: { data: creatorInfo, error: { code: 'ok' } },
        })
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: {
            data: {
              error: {
                code: 'unaudited_client_can_only_post_to_private_accounts',
              },
            },
          },
        });

      await expect(
        createService().initializeDirectPost(directPostParams),
      ).rejects.toThrow('direct posts only work on private TikTok accounts');
      expect(httpClient.post).toHaveBeenCalledTimes(2);
      expect(videoPostWriter.create).not.toHaveBeenCalled();
    });

    it('warns instead of retrying when the init request times out', async () => {
      httpClient.post
        .mockResolvedValueOnce({
          data: { data: creatorInfo, error: { code: 'ok' } },
        })
        .mockRejectedValueOnce({ isAxiosError: true, code: 'ECONNABORTED' });

      await expect(
        createService().initializeDirectPost(directPostParams),
      ).rejects.toThrow('Check your TikTok profile before trying again');
      expect(httpClient.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('syncDirectPostStatus', () => {
    const publishingPost = {
      id: 99,
      status: 'PUBLISHING',
      postUrl: null,
      socialAccount: { userId: 1, accessToken: 'account-token' },
    };

    it('ignores inbox drafts', async () => {
      videoPostReader.findByPlatformPostId.mockResolvedValue(null);
      await expect(
        createService().syncDirectPostStatus(1, 'pub-1', {
          status: 'SEND_TO_USER_INBOX',
        } as never),
      ).resolves.toEqual({ postUrl: null });
      expect(videoPostWriter.update).not.toHaveBeenCalled();
    });

    it("ignores another user's post", async () => {
      videoPostReader.findByPlatformPostId.mockResolvedValue({
        ...publishingPost,
        socialAccount: { userId: 2, accessToken: 't' },
      });
      await createService().syncDirectPostStatus(1, 'pub-1', {
        status: 'FAILED',
      } as never);
      expect(videoPostWriter.update).not.toHaveBeenCalled();
    });

    it('marks failed posts', async () => {
      videoPostReader.findByPlatformPostId.mockResolvedValue(publishingPost);
      await createService().syncDirectPostStatus(1, 'pub-1', {
        status: 'FAILED',
      } as never);
      expect(videoPostWriter.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { status: 'FAILED' },
      });
    });

    it('saves the public post id and URL when publishing completes', async () => {
      videoPostReader.findByPlatformPostId.mockResolvedValue(publishingPost);
      httpClient.post.mockResolvedValueOnce({
        data: { data: creatorInfo, error: { code: 'ok' } },
      });

      const result = await createService().syncDirectPostStatus(1, 'pub-1', {
        status: 'PUBLISH_COMPLETE',
        publicaly_available_post_id: [7123],
      } as never);

      expect(result.postUrl).toBe('https://www.tiktok.com/@miso/video/7123');
      expect(videoPostWriter.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          platformPostId: '7123',
          postUrl: 'https://www.tiktok.com/@miso/video/7123',
        }),
      });
    });

    it('marks private posts published without a URL', async () => {
      videoPostReader.findByPlatformPostId.mockResolvedValue(publishingPost);

      const result = await createService().syncDirectPostStatus(1, 'pub-1', {
        status: 'PUBLISH_COMPLETE',
        publicaly_available_post_id: [],
      } as never);

      expect(result.postUrl).toBeNull();
      expect(httpClient.post).not.toHaveBeenCalled();
      expect(videoPostWriter.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { status: 'PUBLISHED', postedAt: expect.any(Date) },
      });
    });
  });
});
