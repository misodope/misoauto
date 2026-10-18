import { NotFoundException } from '@nestjs/common';
import { PlatformType } from '@backend/generated/prisma/client';
import { InstagramController } from './platform-instagram.controller';
import { validateBody } from '@backend/common';
import { InstagramContainerDto, InstagramUploadDraftDto } from '../dto';

describe('InstagramController', () => {
  const instagramService = {
    getAccountForUser: jest.fn(),
    getAccessTokenForUser: jest.fn(),
    getUserInfo: jest.fn(),
    generateAuthUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    saveOAuthAccount: jest.fn(),
    validateReelVideo: jest.fn(),
    createReelContainer: jest.fn(),
    getContainerStatus: jest.fn(),
    publishContainer: jest.fn(),
    getPublishingLimit: jest.fn(),
  };
  const videosService = {
    getVideo: jest.fn(),
    getVideoPublicUrl: jest.fn(),
    getThumbnailPublicUrl: jest.fn(),
  };
  const platformReader = {
    findByName: jest.fn(),
  };
  const videoPostDraftReader = {
    findByPlatformVideoId: jest.fn(),
  };

  const createController = () =>
    new InstagramController(
      instagramService as never,
      videosService as never,
      platformReader as never,
      videoPostDraftReader as never,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when another user polls an Instagram container', async () => {
    const controller = createController();
    videoPostDraftReader.findByPlatformVideoId.mockResolvedValue({
      platformVideoId: 'container-1',
      video: { userId: 99 },
      platform: { name: PlatformType.INSTAGRAM },
    });

    await expect(
      controller.getPublishStatus({ sub: 1 } as never, {
        containerId: 'container-1',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(instagramService.getContainerStatus).not.toHaveBeenCalled();
  });

  it('returns 404 when another user publishes an Instagram container', async () => {
    const controller = createController();
    videoPostDraftReader.findByPlatformVideoId.mockResolvedValue({
      platformVideoId: 'container-1',
      video: { userId: 99 },
      platform: { name: PlatformType.INSTAGRAM },
    });

    await expect(
      controller.publish({ sub: 1 } as never, { containerId: 'container-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(instagramService.publishContainer).not.toHaveBeenCalled();
  });

  describe('request validation', () => {
    const validate = (
      metatype: typeof InstagramContainerDto | typeof InstagramUploadDraftDto,
      value: unknown,
    ) => validateBody.transform(value, { type: 'body', metatype });

    it('rejects a missing container ID before any draft lookup', async () => {
      await expect(validate(InstagramContainerDto, {})).rejects.toThrow();
      await expect(
        validate(InstagramContainerDto, { containerId: '' }),
      ).rejects.toThrow();
      await expect(
        validate(InstagramContainerDto, { containerId: { $ne: null } }),
      ).rejects.toThrow();
    });

    it('rejects malformed upload bodies', async () => {
      await expect(
        validate(InstagramUploadDraftDto, { videoId: '10' }),
      ).rejects.toThrow();
      await expect(validate(InstagramUploadDraftDto, {})).rejects.toThrow();
      await expect(
        validate(InstagramUploadDraftDto, { videoId: 10, caption: 42 }),
      ).rejects.toThrow();
      await expect(
        validate(InstagramUploadDraftDto, {
          videoId: 10,
          caption: 'x'.repeat(2201),
        }),
      ).rejects.toThrow();
      await expect(
        validate(InstagramUploadDraftDto, {
          videoId: 10,
          shareToFeed: 'false',
        }),
      ).rejects.toThrow();
    });

    it('accepts a valid upload body and strips unknown fields', async () => {
      await expect(
        validate(InstagramUploadDraftDto, {
          videoId: 10,
          caption: 'Hello',
          shareToFeed: false,
          extra: 'ignored',
        }),
      ).resolves.toEqual(
        Object.assign(new InstagramUploadDraftDto(), {
          videoId: 10,
          caption: 'Hello',
          shareToFeed: false,
        }),
      );
    });
  });
});
