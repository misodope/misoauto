import { Module } from '@nestjs/common';
import { SocialAccountReader } from './repository/social-account-reader';
import { SocialAccountWriter } from './repository/social-account-writer';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SocialAccountReader, SocialAccountWriter],
  exports: [SocialAccountReader, SocialAccountWriter],
})
export class SocialAccountModule {}
