import { Module } from '@nestjs/common';
import { SocialAccountReader } from './repository/socialAccountReader';
import { SocialAccountWriter } from './repository/socialAccountWriter';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SocialAccountReader, SocialAccountWriter],
  exports: [SocialAccountReader, SocialAccountWriter],
})
export class SocialAccountModule {}