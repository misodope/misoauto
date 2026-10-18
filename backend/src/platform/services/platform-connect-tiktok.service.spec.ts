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

  const createService = () => {
    (axios.create as jest.Mock).mockReturnValue(httpClient);

    return new PlatformConnectTikTokService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
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
});
