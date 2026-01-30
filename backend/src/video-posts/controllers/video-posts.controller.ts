import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@backend/common/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '@backend/common/decorators/current-user.decorator';
import { VideoPostsService } from '../services/video-posts.service';
import { CreateVideoPostDto } from '../dto/create-video-post.dto';
import { ScheduleVideoPostDto } from '../dto/schedule-video-post.dto';

@Controller('video-posts')
@UseGuards(JwtAuthGuard)
export class VideoPostsController {
  constructor(private readonly videoPostsService: VideoPostsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVideoPostDto,
  ) {
    return this.videoPostsService.create(user.sub, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('videoId') videoId?: string,
  ) {
    if (videoId) {
      return this.videoPostsService.findByVideoId(
        user.sub,
        parseInt(videoId, 10),
      );
    }
    return this.videoPostsService.findAllForUser(user.sub);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.videoPostsService.findOne(user.sub, id);
  }

  @Patch(':id/schedule')
  async schedule(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleVideoPostDto,
  ) {
    return this.videoPostsService.schedule(user.sub, id, dto);
  }

  @Patch(':id/cancel-schedule')
  async cancelSchedule(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.videoPostsService.cancelSchedule(user.sub, id);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.videoPostsService.delete(user.sub, id);
    return { success: true };
  }
}
