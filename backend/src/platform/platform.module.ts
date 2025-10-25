import { Module } from '@nestjs/common';
import { PlatformReader } from './repository/platformReader';
import { PlatformWriter } from './repository/platformWriter';
import { PlatformConnectTikTokService } from './platform-connect-tiktok.service';
import { PlatformConnectInstagramService } from './platform-connect-instagram.service';
import { PlatformConnectYouTubeService } from './platform-connect-youtube.service';
import { InstagramController } from './platform-instagram.controller';
import { TikTokController } from './platform-tiktok.controller';
import { YouTubeController } from './platform-youtube.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
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