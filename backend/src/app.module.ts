import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { PlatformModule } from './platform/platform.module';
import { SocialAccountsModule } from './social-accounts/social-accounts.module';
import { VideoPostsModule } from './video-posts/video-posts.module';
import { AuthModule } from './auth/auth.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    VideosModule,
    PlatformModule,
    SocialAccountsModule,
    VideoPostsModule,
    AuthModule,
    SchedulerModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
