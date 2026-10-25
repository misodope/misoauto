import { AccountRemovalService } from './account-removal.service';

describe('AccountRemovalService', () => {
  const callOrder: string[] = [];
  const tx = {
    socialAccount: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    videoPost: {
      deleteMany: jest.fn(),
    },
    videoPostDraft: {
      deleteMany: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  beforeEach(() => {
    callOrder.length = 0;
    jest.clearAllMocks();
    tx.socialAccount.findUnique.mockResolvedValue({
      id: 7,
      platformId: 3,
      userId: 11,
    });
    tx.videoPost.deleteMany.mockImplementation(async () => {
      callOrder.push('posts');
      return { count: 4 };
    });
    tx.videoPostDraft.deleteMany.mockImplementation(async () => {
      callOrder.push('drafts');
      return { count: 2 };
    });
    tx.socialAccount.delete.mockImplementation(async () => {
      callOrder.push('account');
      return { id: 7 };
    });
  });

  it('deletes posts, drafts, then the account in one transaction', async () => {
    const service = new AccountRemovalService(prisma as never);

    await expect(service.removeAccount(7)).resolves.toBe(true);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(['posts', 'drafts', 'account']);
    expect(tx.videoPost.deleteMany).toHaveBeenCalledWith({
      where: { socialAccountId: 7 },
    });
    expect(tx.videoPostDraft.deleteMany).toHaveBeenCalledWith({
      where: { platformId: 3, video: { userId: 11 } },
    });
    expect(tx.socialAccount.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it('returns false without deleting anything when the account is missing', async () => {
    tx.socialAccount.findUnique.mockResolvedValue(null);
    const service = new AccountRemovalService(prisma as never);

    await expect(service.removeAccount(7)).resolves.toBe(false);

    expect(tx.videoPost.deleteMany).not.toHaveBeenCalled();
    expect(tx.videoPostDraft.deleteMany).not.toHaveBeenCalled();
    expect(tx.socialAccount.delete).not.toHaveBeenCalled();
  });
});
