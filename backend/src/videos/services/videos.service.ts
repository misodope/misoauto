import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoStatus } from '@prisma/client';
import { BlobStorageService } from '@backend/system';
import { VideoReader } from '../repository/video-reader';
import { VideoWriter } from '../repository/video-writer';
import { InitializeUploadDto } from '../dto/initialize-upload.dto';
import { ConfirmUploadDto } from '../dto/confirm-upload.dto';

export interface InitializeUploadResult {
  video: {
    id: number;
    title: string;
    status: VideoStatus;
  };
  upload: {
    url: string;
    key: string;
    expiresAt: Date;
  };
}

@Injectable()
export class VideosService {
  constructor(
    private readonly blobStorage: BlobStorageService,
    private readonly videoReader: VideoReader,
    private readonly videoWriter: VideoWriter,
  ) {}

  async initializeUpload(
    userId: number,
    dto: InitializeUploadDto,
  ): Promise<InitializeUploadResult> {
    const timestamp = Date.now();
    const sanitizedFilename = dto.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `videos/${userId}/${timestamp}-${sanitizedFilename}`;

    // Get presigned upload URL
    const presignedUrl = await this.blobStorage.getSignedUploadUrl(
      key,
      dto.contentType,
      600, // 10 minutes
    );

    // Create video record with PROCESSING status
    const video = await this.videoWriter.create({
      title: dto.title,
      description: dto.description,
      s3Key: key,
      s3Bucket: 'r2', // Could be made dynamic from config
      mimeType: dto.contentType,
      fileSize: dto.fileSize,
      duration: dto.duration,
      status: VideoStatus.PROCESSING,
      user: { connect: { id: userId } },
    });

    return {
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
      },
      upload: {
        url: presignedUrl.url,
        key: presignedUrl.key,
        expiresAt: presignedUrl.expiresAt,
      },
    };
  }

  async confirmUpload(userId: number, videoId: number, dto: ConfirmUploadDto) {
    const video = await this.videoReader.findOne({ id: videoId });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.userId !== userId) {
      throw new NotFoundException('Video not found');
    }

    // Verify file exists in storage
    const exists = await this.blobStorage.exists(video.s3Key);
    if (!exists) {
      throw new NotFoundException('Upload not found in storage');
    }

    // Update video status to READY
    return this.videoWriter.update({
      where: { id: videoId },
      data: {
        status: VideoStatus.READY,
        fileSize: dto.fileSize ?? video.fileSize,
        duration: dto.duration ?? video.duration,
      },
    });
  }

  async getUserVideos(userId: number) {
    return this.videoReader.findByUserId(userId);
  }

  async getVideo(userId: number, videoId: number) {
    const video = await this.videoReader.findOne({ id: videoId });

    if (!video || video.userId !== userId) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async getVideoDownloadUrl(userId: number, videoId: number) {
    const video = await this.getVideo(userId, videoId);
    const url = await this.blobStorage.getSignedDownloadUrl(video.s3Key, 3600);
    return { url, expiresIn: 3600 };
  }

  async deleteVideo(userId: number, videoId: number) {
    const video = await this.getVideo(userId, videoId);

    // Delete from storage
    await this.blobStorage.delete(video.s3Key);

    // Delete from database
    return this.videoWriter.delete({ id: videoId });
  }
}
