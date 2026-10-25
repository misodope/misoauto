import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlatformType } from '@backend/generated/prisma/client';
import { InstagramController } from './platform-instagram.controller';
import { validateBody } from '@backend/common';
import { InstagramContainerDto, InstagramUploadDraftDto } from '../dto';
import { createMetaSignedRequest } from '@backend/common/utils/meta-signed-request.test-utils';

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
    findAccountsBySignedRequestUserId: jest.fn(),
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
  const dataDeletionService = {
    handleRequest: jest.fn(),
  };
  const accountRemovalService = {
    removeAccount: jest.fn(),
  };

  const createController = () =>
    new InstagramController(
      instagramService as never,
      videosService as never,
      platformReader as never,
      videoPostDraftReader as never,
      dataDeletionService as never,
      accountRemovalService as never,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INSTAGRAM_CLIENT_SECRET = 'instagram-secret';
    process.env.META_APP_SECRET = '';
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

  describe('Meta callbacks', () => {
    it('removes a matching account and returns a deletion confirmation', async () => {
      const controller = createController();
      const signedRequest = createMetaSignedRequest(
        'instagram-user',
        'instagram-secret',
      );
      instagramService.findAccountsBySignedRequestUserId.mockResolvedValue([
        { account: { id: 12 }, matchedOn: 'accountId' },
      ]);
      accountRemovalService.removeAccount.mockResolvedValue(true);
      dataDeletionService.handleRequest.mockImplementation(async (params) => {
        const dataFound = await params.remove();
        expect(dataFound).toBe(true);
        return { confirmationCode: 'confirmation-code' };
      });

      await expect(controller.dataDeletion(signedRequest)).resolves.toEqual({
        url: expect.stringContaining('/data-deletion?code=confirmation-code'),
        confirmation_code: 'confirmation-code',
      });
      expect(accountRemovalService.removeAccount).toHaveBeenCalledWith(12);
      expect(dataDeletionService.handleRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: PlatformType.INSTAGRAM,
        }),
      );
    });

    it('returns a confirmation when no Instagram account matches', async () => {
      const controller = createController();
      instagramService.findAccountsBySignedRequestUserId.mockResolvedValue([]);
      dataDeletionService.handleRequest.mockImplementation(async (params) => {
        await expect(params.remove()).resolves.toBe(false);
        return { confirmationCode: 'confirmation-code' };
      });

      await expect(
        controller.dataDeletion(
          createMetaSignedRequest('unknown-user', 'instagram-secret'),
        ),
      ).resolves.toEqual({
        url: expect.any(String),
        confirmation_code: 'confirmation-code',
      });
      expect(accountRemovalService.removeAccount).not.toHaveBeenCalled();
    });

    it('supports an app-scoped ID match', async () => {
      const controller = createController();
      instagramService.findAccountsBySignedRequestUserId.mockResolvedValue([
        { account: { id: 12 }, matchedOn: 'appScopedUserId' },
      ]);
      accountRemovalService.removeAccount.mockResolvedValue(true);
      dataDeletionService.handleRequest.mockImplementation(async (params) => ({
        confirmationCode: 'confirmation-code',
        dataFound: await params.remove(),
      }));

      await controller.dataDeletion(
        createMetaSignedRequest('app-scoped-user', 'instagram-secret'),
      );

      expect(accountRemovalService.removeAccount).toHaveBeenCalledWith(12);
    });

    it.each([undefined, 'tampered'])(
      'rejects an invalid or missing signed_request (%s)',
      async (signedRequest) => {
        const controller = createController();

        await expect(controller.dataDeletion(signedRequest)).rejects.toThrow(
          BadRequestException,
        );
        expect(dataDeletionService.handleRequest).not.toHaveBeenCalled();
        expect(accountRemovalService.removeAccount).not.toHaveBeenCalled();
      },
    );

    it('deauthorizes a matching account', async () => {
      const controller = createController();
      instagramService.findAccountsBySignedRequestUserId.mockResolvedValue([
        { account: { id: 12 }, matchedOn: 'accountId' },
      ]);
      accountRemovalService.removeAccount.mockResolvedValue(true);

      await expect(
        controller.deauthorize(
          createMetaSignedRequest('instagram-user', 'instagram-secret'),
        ),
      ).resolves.toEqual({});
      expect(accountRemovalService.removeAccount).toHaveBeenCalledWith(12);
      expect(dataDeletionService.handleRequest).not.toHaveBeenCalled();
    });

    it('rejects an invalid deauthorize request', async () => {
      const controller = createController();

      await expect(controller.deauthorize('invalid')).rejects.toThrow(
        BadRequestException,
      );
      expect(accountRemovalService.removeAccount).not.toHaveBeenCalled();
    });
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
