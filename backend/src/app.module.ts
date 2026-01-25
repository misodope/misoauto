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
import { QueueModule } from './system/queue';
import { BlobStorageModule } from './system/blob-storage';
import { NotificationsModule } from './system/notifications';

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
    QueueModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BlobStorageModule.forRoot({
      provider: 'cloudflare-r2',
      bucket: process.env.R2_BUCKET || '',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      publicUrl: process.env.R2_PUBLIC_URL,
    }),
    NotificationsModule.forRoot({
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        defaultFrom: process.env.TWILIO_DEFAULT_FROM || '',
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
