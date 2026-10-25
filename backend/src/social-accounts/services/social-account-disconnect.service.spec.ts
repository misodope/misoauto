import { NotFoundException } from '@nestjs/common';
import {
  PlatformType,
  SocialAccountDisconnectState,
} from '@backend/generated/prisma/client';
import { SocialAccountDisconnectService } from './social-account-disconnect.service';

describe('SocialAccountDisconnectService', () => {
  const prisma = {
    videoPost: { updateMany: jest.fn() },
  };
  const socialAccountReader = {
    findIncludingDeleted: jest.fn(),
  };
  const socialAccountWriter = {
    beginDisconnect: jest.fn(),
    finishDisconnect: jest.fn(),
  };
  const providerRevoker = { revoke: jest.fn() };

  const createService = () =>
    new SocialAccountDisconnectService(
      prisma as never,
      socialAccountReader as never,
      socialAccountWriter as never,
      providerRevoker as never,
    );

  const activeAccount = {
    id: 7,
    userId: 11,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    platform: { name: PlatformType.TIKTOK },
    deletedAt: null,
    disconnectState: SocialAccountDisconnectState.ACTIVE,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    socialAccountReader.findIncludingDeleted.mockResolvedValue(activeAccount);
    socialAccountWriter.beginDisconnect.mockResolvedValue(true);
    socialAccountWriter.finishDisconnect.mockResolvedValue({ id: 7 });
    providerRevoker.revoke.mockResolvedValue({ status: 'revoked' });
    prisma.videoPost.updateMany.mockResolvedValue({ count: 1 });
  });

  it('claims, cancels future work, revokes, and finalizes without hard deletion', async () => {
    await createService().disconnect(11, 7);

    expect(socialAccountWriter.beginDisconnect).toHaveBeenCalledWith(7, 11);
    expect(prisma.videoPost.updateMany).toHaveBeenCalledWith({
      where: {
        socialAccountId: 7,
        deletedAt: null,
        status: { in: ['PENDING', 'SCHEDULED'] },
      },
      data: {
        status: 'CANCELLED',
        scheduledFor: null,
        cancellationReason: 'ACCOUNT_DISCONNECTED',
      },
    });
    expect(providerRevoker.revoke).toHaveBeenCalledWith(
      PlatformType.TIKTOK,
      'access-token',
      'refresh-token',
    );
    expect(socialAccountWriter.finishDisconnect).toHaveBeenCalledWith(7);
  });

  it('returns 404 for a missing or foreign account', async () => {
    socialAccountReader.findIncludingDeleted.mockResolvedValueOnce(null);
    await expect(createService().disconnect(11, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    socialAccountReader.findIncludingDeleted.mockResolvedValueOnce({
      ...activeAccount,
      userId: 99,
    });
    await expect(createService().disconnect(11, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(providerRevoker.revoke).not.toHaveBeenCalled();
  });

  it('is idempotent for an already disconnected account', async () => {
    socialAccountReader.findIncludingDeleted.mockResolvedValue({
      ...activeAccount,
      deletedAt: new Date(),
      disconnectState: SocialAccountDisconnectState.DISCONNECTED,
      accessToken: null,
      refreshToken: null,
    });

    await createService().disconnect(11, 7);

    expect(socialAccountWriter.beginDisconnect).not.toHaveBeenCalled();
    expect(providerRevoker.revoke).not.toHaveBeenCalled();
    expect(socialAccountWriter.finishDisconnect).not.toHaveBeenCalled();
  });

  it('repairs an interrupted disconnect without restoring credentials', async () => {
    socialAccountReader.findIncludingDeleted.mockResolvedValue({
      ...activeAccount,
      deletedAt: new Date(),
      disconnectState: SocialAccountDisconnectState.DISCONNECTING,
      disconnectStartedAt: new Date(0),
      accessToken: null,
      refreshToken: null,
    });

    await createService().disconnect(11, 7);

    expect(prisma.videoPost.updateMany).toHaveBeenCalled();
    expect(socialAccountWriter.finishDisconnect).toHaveBeenCalledWith(
      7,
      'DISCONNECT_INTERRUPTED',
    );
    expect(providerRevoker.revoke).not.toHaveBeenCalled();
  });

  it('does not repeat revocation when another request already claimed the row', async () => {
    socialAccountWriter.beginDisconnect.mockResolvedValue(false);

    await createService().disconnect(11, 7);

    expect(providerRevoker.revoke).not.toHaveBeenCalled();
    expect(prisma.videoPost.updateMany).not.toHaveBeenCalled();
  });

  it('records a sanitized remote failure while still finalizing local disconnect', async () => {
    providerRevoker.revoke.mockResolvedValue({
      status: 'failed',
      reason: 'timeout',
    });

    await createService().disconnect(11, 7);

    expect(socialAccountWriter.finishDisconnect).toHaveBeenCalledWith(
      7,
      'REMOTE_REVOKE_FAILED:timeout',
    );
  });
});
