import { Module } from '@nestjs/common';
import { PlatformRepository } from './platform.repository';
import { PlatformConnectTikTokService } from './platform-connect-tiktok.service';
import { PlatformConnectInstagramService } from './platform-connect-instagram.service';
import { PlatformConnectYouTubeService } from './platform-connect-youtube.service';
import { InstagramController } from './platform-instagram.controller';
import { TikTokController } from './platform-tiktok.controller';
import { YouTubeController } from './platform-youtube.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    InstagramController,
    TikTokController,
    YouTubeController,
  ],
  providers: [
    PlatformRepository,
    PlatformConnectTikTokService,
    PlatformConnectInstagramService,
    PlatformConnectYouTubeService,
  ],
  exports: [
    PlatformRepository,
    PlatformConnectTikTokService,
    PlatformConnectInstagramService,
    PlatformConnectYouTubeService,
  ],
})
export class PlatformModule {}
