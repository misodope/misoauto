import { ArgumentMetadata } from '@nestjs/common';
import { validateBody } from '@backend/common';
import { YouTubeController } from './platform-youtube.controller';
import {
  YouTubePublishDto,
  YouTubePublishStatusDto,
  YouTubeUploadDraftDto,
} from '../dto';

describe('YouTubeController', () => {
  const youtubeService = {
    getAccountForUser: jest.fn(),
    validateYouTubeVideo: jest.fn(),
    initializeVideoUpload: jest.fn(),
    getProcessingStatusForUser: jest.fn(),
    publishForUser: jest.fn(),
  };
  const videosService = {
    getVideo: jest.fn(),
  };

  const createController = () =>
    new YouTubeController(youtubeService as never, videosService as never);

  beforeEach(() => {
    jest.clearAllMocks();
    youtubeService.getAccountForUser.mockResolvedValue({
      id: 8,
      platformId: 3,
      accessToken: 'yt-token',
    });
  });

  it('delegates status polling with the current user for ownership checks', async () => {
    const controller = createController();
    youtubeService.getProcessingStatusForUser.mockResolvedValue({
      videoId: 'yt-video-1',
      processingStatus: 'processing',
    });

    await expect(
      controller.getPublishStatus({ sub: 1 } as never, {
        videoId: 'yt-video-1',
      }),
    ).resolves.toMatchObject({ platform: 'youtube' });
    expect(youtubeService.getProcessingStatusForUser).toHaveBeenCalledWith(
      1,
      'yt-video-1',
    );
  });

  it('publishes as public by default', async () => {
    const controller = createController();
    youtubeService.publishForUser.mockResolvedValue({
      videoId: 'yt-video-1',
      url: 'https://www.youtube.com/watch?v=yt-video-1',
      privacyStatus: 'public',
    });

    await expect(
      controller.publish({ sub: 1 } as never, { videoId: 'yt-video-1' }),
    ).resolves.toMatchObject({ platform: 'youtube', privacyStatus: 'public' });
    expect(youtubeService.publishForUser).toHaveBeenCalledWith(
      1,
      'yt-video-1',
      'public',
    );
  });

  it('uploads with overridden metadata and the stored thumbnail', async () => {
    const controller = createController();
    videosService.getVideo.mockResolvedValue({
      id: 10,
      title: 'Stored title',
      description: 'Stored description',
      s3Key: 'videos/10.mp4',
      s3ThumbnailKey: 'thumbs/10.jpg',
      mimeType: 'video/mp4',
    });
    youtubeService.initializeVideoUpload.mockResolvedValue({
      videoId: 'yt-video-1',
      title: 'New title',
      status: 'uploaded',
    });

    await controller.uploadDraftVideo({ sub: 1 } as never, {
      videoId: 10,
      title: '  New title  ',
      madeForKids: true,
    });

    expect(youtubeService.validateYouTubeVideo).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'video/mp4' }),
      { title: 'New title', description: 'Stored description' },
    );
    expect(youtubeService.initializeVideoUpload).toHaveBeenCalledWith({
      accessToken: 'yt-token',
      s3Key: 'videos/10.mp4',
      videoId: 10,
      title: 'New title',
      description: 'Stored description',
      madeForKids: true,
      thumbnailKey: 'thumbs/10.jpg',
    });
  });

  describe('request validation', () => {
    const validate = (metatype: ArgumentMetadata['metatype'], value: unknown) =>
      validateBody.transform(value, { type: 'body', metatype });

    it('rejects unsupported privacy statuses', async () => {
      await expect(
        validate(YouTubePublishDto, {
          videoId: 'yt-video-1',
          privacyStatus: 'private',
        }),
      ).rejects.toThrow();
    });

    it('requires a YouTube video ID when polling', async () => {
      await expect(validate(YouTubePublishStatusDto, {})).rejects.toThrow();
    });

    it('rejects over-long titles and non-numeric video IDs', async () => {
      await expect(
        validate(YouTubeUploadDraftDto, {
          videoId: 10,
          title: 'x'.repeat(101),
        }),
      ).rejects.toThrow();
      await expect(
        validate(YouTubeUploadDraftDto, { videoId: 'abc' }),
      ).rejects.toThrow();
    });

    it('strips unknown fields from valid bodies', async () => {
      await expect(
        validate(YouTubeUploadDraftDto, {
          videoId: 10,
          madeForKids: false,
          extra: 'ignored',
        }),
      ).resolves.toEqual(
        Object.assign(new YouTubeUploadDraftDto(), {
          videoId: 10,
          madeForKids: false,
        }),
      );
    });
  });
});
