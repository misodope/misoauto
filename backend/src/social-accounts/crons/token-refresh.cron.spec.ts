import { PlatformType } from '@backend/generated/prisma/client';
import { TokenRefreshCron } from './token-refresh.cron';

describe('TokenRefreshCron', () => {
  const socialAccountReader = { findAll: jest.fn() };
  const socialAccountWriter = { updateTokens: jest.fn() };
  const tiktokService = { refreshAccessToken: jest.fn() };
  const youtubeService = { refreshAccessToken: jest.fn() };
  const instagramService = { refreshLongLivedToken: jest.fn() };

  const createCron = () =>
    new TokenRefreshCron(
      socialAccountReader as never,
      socialAccountWriter as never,
      tiktokService as never,
      youtubeService as never,
      instagramService as never,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes an Instagram account without a refresh token', async () => {
    const cron = createCron();
    const account = {
      id: 4,
      accessToken: 'old-instagram-token',
      refreshToken: null,
      platform: { name: PlatformType.INSTAGRAM },
    };
    instagramService.refreshLongLivedToken.mockResolvedValue({
      access_token: 'new-instagram-token',
      expires_in: 5_183_944,
    });

    await (cron as any).refreshAccountToken(account);

    expect(instagramService.refreshLongLivedToken).toHaveBeenCalledWith(
      'old-instagram-token',
    );
    expect(socialAccountWriter.updateTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 4,
        accessToken: 'new-instagram-token',
        refreshToken: null,
        tokenExpiry: expect.any(Date),
      }),
    );
  });

  it('keeps TikTok refresh behavior unchanged', async () => {
    const cron = createCron();
    const account = {
      id: 5,
      accessToken: 'old-tiktok-token',
      refreshToken: 'tiktok-refresh-token',
      platform: { name: PlatformType.TIKTOK },
    };
    tiktokService.refreshAccessToken.mockResolvedValue({
      access_token: 'new-tiktok-token',
      refresh_token: 'new-refresh-token',
      expires_in: 86_400,
    });

    await (cron as any).refreshAccountToken(account);

    expect(tiktokService.refreshAccessToken).toHaveBeenCalledWith(
      'tiktok-refresh-token',
    );
    expect(socialAccountWriter.updateTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        accessToken: 'new-tiktok-token',
        refreshToken: 'new-refresh-token',
        tokenExpiry: expect.any(Date),
      }),
    );
  });

  it('selects YouTube tokens before their one-hour expiry', async () => {
    const cron = createCron();
    socialAccountReader.findAll.mockResolvedValue([]);

    await cron.handleTokenRefresh();

    const where = socialAccountReader.findAll.mock.calls[0][0].where;
    const youtubeCondition = where.OR.find(
      (condition: { platform?: { name?: PlatformType } }) =>
        condition.platform?.name === PlatformType.YOUTUBE,
    );

    expect(youtubeCondition).toEqual({
      platform: { name: PlatformType.YOUTUBE },
      refreshToken: { not: null },
      tokenExpiry: { lte: expect.any(Date) },
    });

    const refreshWindowMs =
      youtubeCondition.tokenExpiry.lte.getTime() - Date.now();
    expect(refreshWindowMs).toBeGreaterThan(44 * 60 * 1000);
    expect(refreshWindowMs).toBeLessThan(46 * 60 * 1000);
  });

  it('refreshes a YouTube access token and preserves its refresh token', async () => {
    const cron = createCron();
    const account = {
      id: 6,
      accessToken: 'old-youtube-token',
      refreshToken: 'youtube-refresh-token',
      platform: { name: PlatformType.YOUTUBE },
    };
    youtubeService.refreshAccessToken.mockResolvedValue({
      access_token: 'new-youtube-token',
      expires_in: 3600,
    });

    await (cron as any).refreshAccountToken(account);

    expect(youtubeService.refreshAccessToken).toHaveBeenCalledWith(
      'youtube-refresh-token',
    );
    expect(socialAccountWriter.updateTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 6,
        accessToken: 'new-youtube-token',
        refreshToken: 'youtube-refresh-token',
        tokenExpiry: expect.any(Date),
      }),
    );
  });
});
