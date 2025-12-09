import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from '@backend/user';
import { VideoModule } from './video/video.module';
import { PlatformModule } from './platform/platform.module';
import { SocialAccountModule } from './social-account/social-account.module';
import { VideoPostModule } from './video-post/video-post.module';
import { AuthModule } from '@backend/auth/auth.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    VideoModule,
    PlatformModule,
    SocialAccountModule,
    VideoPostModule,
    AuthModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}