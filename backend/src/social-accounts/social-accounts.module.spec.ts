import { Test } from '@nestjs/testing';
import { SocialAccountsModule } from './social-accounts.module';
import { NotificationsModule } from '../system/notifications';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('SocialAccountsModule', () => {
  it('compiles with the JWT guard dependencies wired', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        NotificationsModule.forRoot({
          twilio: {
            accountSid: 'AC00000000000000000000000000000000',
            authToken: 'test-auth-token',
            defaultFrom: '+15555555555',
          },
        }),
        SocialAccountsModule,
      ],
    }).compile();

    await moduleRef.close();
  });
});
