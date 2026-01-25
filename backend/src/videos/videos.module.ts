import { Module } from '@nestjs/common';
import { VideoReader } from './repository/video-reader';
import { VideoWriter } from './repository/video-writer';
import { VideosService } from './services/videos.service';
import { VideosController } from './controllers/videos.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VideosController],
  providers: [VideoReader, VideoWriter, VideosService],
  exports: [VideoReader, VideoWriter, VideosService],
})
export class VideosModule {}
