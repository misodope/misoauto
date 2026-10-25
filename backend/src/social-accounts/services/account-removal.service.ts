import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AccountRemovalService {
  private readonly logger = new Logger(AccountRemovalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Removes a connected social account and everything MisoAuto stored from
   * it. The operation is idempotent and runs in one transaction.
   */
  async removeAccount(socialAccountId: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.socialAccount.findUnique({
        where: { id: socialAccountId },
      });

      if (!account) {
        return false;
      }

      const posts = await tx.videoPost.deleteMany({
        where: { socialAccountId },
      });

      // Drafts do not carry a social-account foreign key. Since a user cannot
      // have multiple accounts per platform today, scope them by owner and
      // platform; that is acceptable until multiple accounts are supported.
      const drafts = await tx.videoPostDraft.deleteMany({
        where: {
          platformId: account.platformId,
          video: { userId: account.userId },
        },
      });

      await tx.socialAccount.delete({ where: { id: socialAccountId } });

      this.logger.log(
        `Removed social account ${socialAccountId} (platform ${account.platformId}): ${posts.count} posts, ${drafts.count} drafts`,
      );
      return true;
    });
  }
}
