import { Module } from '@nestjs/common';
import { PlatformReader } from './repository/platform-reader';
import { PlatformWriter } from './repository/platform-writer';
import { PlatformConnectTikTokService } from './services/platform-connect-tiktok.service';
import { PlatformConnectInstagramService } from './services/platform-connect-instagram.service';
import { PlatformConnectYouTubeService } from './services/platform-connect-youtube.service';
import { InstagramController } from './controllers/platform-instagram.controller';
import { TikTokController } from './controllers/platform-tiktok.controller';
import { YouTubeController } from './controllers/platform-youtube.controller';
import { PrismaModule } from '../database/prisma.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, SocialAccountsModule, AuthModule],
  controllers: [InstagramController, TikTokController, YouTubeController],
  providers: [
    PlatformReader,
    PlatformWriter,
    PlatformConnectTikTokService,
    PlatformConnectInstagramService,
    PlatformConnectYouTubeService,
  ],
  exports: [
    PlatformReader,
    PlatformWriter,
    PlatformConnectTikTokService,
    PlatformConnectInstagramService,
    PlatformConnectYouTubeService,
  ],
})
export class PlatformModule {}
