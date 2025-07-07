import { Module } from '@nestjs/common';
import { SocialAccountRepository } from './social-account.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SocialAccountRepository],
  exports: [SocialAccountRepository],
})
export class SocialAccountModule {}
