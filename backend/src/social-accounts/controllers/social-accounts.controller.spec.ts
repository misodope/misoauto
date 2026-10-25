import { SocialAccountsController } from './social-accounts.controller';

describe('SocialAccountsController', () => {
  it('passes the authenticated owner and local account ID to disconnect', async () => {
    const disconnect = jest.fn();
    const controller = new SocialAccountsController({ disconnect } as never);

    await controller.disconnect({ sub: 42 } as never, 9);

    expect(disconnect).toHaveBeenCalledWith(42, 9);
  });
});
