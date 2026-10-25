import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoStatus } from '@backend/generated/prisma/client';
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
  thumbnailUpload?: {
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
    const thumbnailKey = dto.thumbnailContentType
      ? `thumbnails/${userId}/${timestamp}-${sanitizedFilename}.jpg`
      : undefined;

    const [presignedUrl, thumbnailPresignedUrl] = await Promise.all([
      this.blobStorage.getSignedUploadUrl(key, dto.contentType, 600),
      thumbnailKey && dto.thumbnailContentType
        ? this.blobStorage.getSignedUploadUrl(
            thumbnailKey,
            dto.thumbnailContentType,
            600,
          )
        : Promise.resolve(undefined),
    ]);

    // Create video record with PROCESSING status
    const video = await this.videoWriter.create({
      title: dto.title,
      description: dto.description,
      s3Key: key,
      s3ThumbnailKey: thumbnailKey,
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
      ...(thumbnailPresignedUrl && {
        thumbnailUpload: {
          url: thumbnailPresignedUrl.url,
          key: thumbnailPresignedUrl.key,
          expiresAt: thumbnailPresignedUrl.expiresAt,
        },
      }),
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

    if (video.s3ThumbnailKey) {
      const thumbnailExists = await this.blobStorage.exists(
        video.s3ThumbnailKey,
      );
      if (!thumbnailExists) {
        throw new NotFoundException('Thumbnail upload not found in storage');
      }
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

  async getVideoPublicUrl(userId: number, videoId: number) {
    const video = await this.getVideo(userId, videoId);
    return this.blobStorage.getPublicUrl(video.s3Key);
  }

  async getThumbnailPublicUrl(userId: number, videoId: number) {
    const video = await this.getVideo(userId, videoId);
    return video.s3ThumbnailKey
      ? this.blobStorage.getPublicUrl(video.s3ThumbnailKey)
      : undefined;
  }

  async deleteVideo(userId: number, videoId: number) {
    const video = await this.getVideo(userId, videoId);
    // Keep both database metadata and storage objects recoverable.
    return this.videoWriter.delete({ id: videoId });
  }
}
