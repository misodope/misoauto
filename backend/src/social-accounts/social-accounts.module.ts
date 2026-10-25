import { Module } from '@nestjs/common';
import { SocialAccountReader } from './repository/social-account-reader';
import { SocialAccountWriter } from './repository/social-account-writer';
import { PrismaModule } from '../database/prisma.module';
import { SocialAccountsController } from './controllers/social-accounts.controller';
import { SocialAccountDisconnectService } from './services/social-account-disconnect.service';
import { SocialAccountProviderRevoker } from './services/social-account-provider-revoker';
import { AuthModule } from '../auth/auth.module';
import { AccountRemovalService } from './services/account-removal.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SocialAccountsController],
  providers: [
    SocialAccountReader,
    SocialAccountWriter,
    SocialAccountDisconnectService,
    SocialAccountProviderRevoker,
    AccountRemovalService,
  ],
  exports: [SocialAccountReader, SocialAccountWriter, AccountRemovalService],
})
export class SocialAccountsModule {}
