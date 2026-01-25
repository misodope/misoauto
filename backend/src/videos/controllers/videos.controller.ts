import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@backend/common/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '@backend/common/decorators/current-user.decorator';
import { VideosService } from '../services/videos.service';
import { InitializeUploadDto } from '../dto/initialize-upload.dto';
import { ConfirmUploadDto } from '../dto/confirm-upload.dto';

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload/initialize')
  async initializeUpload(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitializeUploadDto,
  ) {
    return this.videosService.initializeUpload(user.sub, dto);
  }

  @Post(':id/upload/confirm')
  async confirmUpload(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.videosService.confirmUpload(user.sub, id, dto);
  }

  @Get()
  async getUserVideos(@CurrentUser() user: JwtPayload) {
    return this.videosService.getUserVideos(user.sub);
  }

  @Get(':id')
  async getVideo(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.videosService.getVideo(user.sub, id);
  }

  @Get(':id/download-url')
  async getDownloadUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.videosService.getVideoDownloadUrl(user.sub, id);
  }

  @Delete(':id')
  async deleteVideo(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.videosService.deleteVideo(user.sub, id);
  }
}
