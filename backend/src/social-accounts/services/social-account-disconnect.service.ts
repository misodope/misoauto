import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PlatformType,
  PostStatus,
  SocialAccountDisconnectState,
} from '@backend/generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SocialAccountReader } from '../repository/social-account-reader';
import { SocialAccountWriter } from '../repository/social-account-writer';
import { SocialAccountProviderRevoker } from './social-account-provider-revoker';

const ACCOUNT_DISCONNECTED_REASON = 'ACCOUNT_DISCONNECTED';
const DISCONNECT_RECOVERY_DELAY_MS = 30_000;

@Injectable()
export class SocialAccountDisconnectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly providerRevoker: SocialAccountProviderRevoker,
  ) {}

  async disconnect(userId: number, accountId: number): Promise<void> {
    const account = await this.socialAccountReader.findIncludingDeleted({
      id: accountId,
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Social account not found');
    }

    if (account.disconnectState === SocialAccountDisconnectState.DISCONNECTED) {
      return;
    }

    // A crashed or timed-out request can leave a locally disabled account in
    // DISCONNECTING. Credentials have already been cleared at that point, so
    // make the local state terminal and retain an explicit recovery marker.
    if (
      account.disconnectState === SocialAccountDisconnectState.DISCONNECTING
    ) {
      const disconnectAge = account.disconnectStartedAt
        ? Date.now() - account.disconnectStartedAt.getTime()
        : DISCONNECT_RECOVERY_DELAY_MS;
      if (disconnectAge < DISCONNECT_RECOVERY_DELAY_MS) {
        return;
      }

      await this.cancelFuturePosts(accountId);
      await this.socialAccountWriter.finishDisconnect(
        accountId,
        'DISCONNECT_INTERRUPTED',
      );
      return;
    }

    const accessToken = account.accessToken;
    const refreshToken = account.refreshToken;
    const claimed = await this.socialAccountWriter.beginDisconnect(
      accountId,
      userId,
    );

    if (!claimed) {
      return;
    }

    await this.cancelFuturePosts(accountId);

    const revokeResult = await this.providerRevoker.revoke(
      account.platform.name as PlatformType,
      accessToken,
      refreshToken,
    );

    const disconnectError =
      revokeResult.status === 'failed'
        ? `REMOTE_REVOKE_FAILED:${revokeResult.reason}`
        : revokeResult.status === 'unsupported'
          ? 'REMOTE_REVOKE_UNSUPPORTED'
          : undefined;

    if (disconnectError) {
      await this.socialAccountWriter.finishDisconnect(
        accountId,
        disconnectError,
      );
    } else {
      await this.socialAccountWriter.finishDisconnect(accountId);
    }
  }

  private async cancelFuturePosts(socialAccountId: number): Promise<void> {
    await this.prisma.videoPost.updateMany({
      where: {
        socialAccountId,
        deletedAt: null,
        status: { in: [PostStatus.PENDING, PostStatus.SCHEDULED] },
      },
      data: {
        status: PostStatus.CANCELLED,
        scheduledFor: null,
        cancellationReason: ACCOUNT_DISCONNECTED_REASON,
      },
    });
  }
}
