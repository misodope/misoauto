import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PlatformType,
  PostStatus,
  UploadMode,
  VideoStatus,
} from '@backend/generated/prisma/client';
import { VideoPostsService } from './video-posts.service';
import { VideoPostDetailsService } from './video-post-details.service';

describe('VideoPostsService', () => {
  const userId = 7;
  const postId = 42;

  const videoPostReader = {
    findOne: jest.fn(),
    findByVideoAndAccounts: jest.fn(),
  };
  const videoPostWriter = {
    updateIfStatus: jest.fn(),
    saveBatch: jest.fn(),
  };
  const videoReader = {
    findOne: jest.fn(),
  };
  const socialAccountReader = {
    findOne: jest.fn(),
    findManyByIdsForUser: jest.fn(),
  };

  const createService = () =>
    new VideoPostsService(
      videoPostReader as never,
      videoPostWriter as never,
      videoReader as never,
      socialAccountReader as never,
      new VideoPostDetailsService(),
    );

  const makePost = (status: PostStatus, ownerId = userId) => ({
    id: postId,
    status,
    video: { userId: ownerId },
  });

  const futureDate = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cancelSchedule', () => {
    it('moves a scheduled post back to pending', async () => {
      videoPostReader.findOne
        .mockResolvedValueOnce(makePost(PostStatus.SCHEDULED))
        .mockResolvedValueOnce(makePost(PostStatus.PENDING));
      videoPostWriter.updateIfStatus.mockResolvedValue(1);

      const result = await createService().cancelSchedule(userId, postId);

      expect(videoPostWriter.updateIfStatus).toHaveBeenCalledWith({
        id: postId,
        allowedStatuses: [PostStatus.SCHEDULED],
        data: { status: PostStatus.PENDING, scheduledFor: null },
      });
      expect(result.status).toBe(PostStatus.PENDING);
    });

    it('rejects when the post is no longer scheduled', async () => {
      videoPostReader.findOne.mockResolvedValue(
        makePost(PostStatus.PUBLISHING),
      );
      videoPostWriter.updateIfStatus.mockResolvedValue(0);

      await expect(
        createService().cancelSchedule(userId, postId),
      ).rejects.toThrow(new BadRequestException('Post is not scheduled'));
    });

    it("hides another user's post", async () => {
      videoPostReader.findOne.mockResolvedValue(
        makePost(PostStatus.SCHEDULED, 99),
      );

      await expect(
        createService().cancelSchedule(userId, postId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(videoPostWriter.updateIfStatus).not.toHaveBeenCalled();
    });
  });

  describe('schedule', () => {
    it('rejects a time in the past', async () => {
      videoPostReader.findOne.mockResolvedValue(makePost(PostStatus.PENDING));

      await expect(
        createService().schedule(userId, postId, {
          scheduledFor: new Date(Date.now() - 1000).toISOString(),
        }),
      ).rejects.toThrow(
        new BadRequestException('Scheduled time must be in the future'),
      );
      expect(videoPostWriter.updateIfStatus).not.toHaveBeenCalled();
    });

    it.each([PostStatus.PENDING, PostStatus.SCHEDULED, PostStatus.FAILED])(
      'schedules a %s post',
      async (status) => {
        videoPostReader.findOne
          .mockResolvedValueOnce(makePost(status))
          .mockResolvedValueOnce(makePost(PostStatus.SCHEDULED));
        videoPostWriter.updateIfStatus.mockResolvedValue(1);
        const scheduledFor = futureDate();

        const result = await createService().schedule(userId, postId, {
          scheduledFor,
        });

        expect(videoPostWriter.updateIfStatus).toHaveBeenCalledWith({
          id: postId,
          allowedStatuses: [
            PostStatus.PENDING,
            PostStatus.SCHEDULED,
            PostStatus.FAILED,
          ],
          data: {
            status: PostStatus.SCHEDULED,
            scheduledFor: new Date(scheduledFor),
          },
        });
        expect(result.status).toBe(PostStatus.SCHEDULED);
      },
    );

    it('rejects when the post moved past schedulable states', async () => {
      videoPostReader.findOne.mockResolvedValue(makePost(PostStatus.PUBLISHED));
      videoPostWriter.updateIfStatus.mockResolvedValue(0);

      await expect(
        createService().schedule(userId, postId, {
          scheduledFor: futureDate(),
        }),
      ).rejects.toThrow(
        new BadRequestException('Post can no longer be scheduled'),
      );
    });
  });

  describe('createBatch', () => {
    const video = {
      id: 1,
      userId,
      status: VideoStatus.READY,
      title: 'Launch video',
      description: 'All about the launch',
    };
    const youtubeAccount = {
      id: 10,
      platformId: 1,
      username: 'chan',
      platform: { name: PlatformType.YOUTUBE, displayName: 'YouTube' },
    };
    const instagramAccount = {
      id: 11,
      platformId: 3,
      username: 'gram',
      platform: { name: PlatformType.INSTAGRAM, displayName: 'Instagram' },
    };
    const facebookAccount = {
      id: 12,
      platformId: 2,
      username: 'book',
      platform: { name: PlatformType.FACEBOOK, displayName: 'Facebook' },
    };

    const batchDto = (
      socialAccountIds: number[],
      scheduledFor = futureDate(),
    ) => ({
      videoId: video.id,
      scheduledFor,
      targets: socialAccountIds.map((socialAccountId) => ({ socialAccountId })),
    });

    beforeEach(() => {
      videoReader.findOne.mockResolvedValue(video);
      socialAccountReader.findManyByIdsForUser.mockResolvedValue([
        youtubeAccount,
        instagramAccount,
        facebookAccount,
      ]);
      videoPostReader.findByVideoAndAccounts.mockResolvedValue([]);
      videoPostWriter.saveBatch.mockImplementation(({ creates, updates }) =>
        Promise.resolve([...updates, ...creates]),
      );
    });

    it('creates draft posts with details snapshotted from the video', async () => {
      const dto = batchDto([youtubeAccount.id, instagramAccount.id]);

      const result = await createService().createBatch(userId, dto);

      const { creates, updates } = videoPostWriter.saveBatch.mock.calls[0][0];
      expect(updates).toEqual([]);
      expect(creates).toHaveLength(2);
      expect(creates[0]).toMatchObject({
        status: PostStatus.SCHEDULED,
        scheduledFor: new Date(dto.scheduledFor),
        uploadMode: UploadMode.DRAFT,
        title: 'Launch video',
        caption: 'All about the launch',
        options: { privacyStatus: 'public', madeForKids: false },
        batchId: result.batchId,
        socialAccount: { connect: { id: youtubeAccount.id } },
        platform: { connect: { id: youtubeAccount.platformId } },
      });
      expect(creates[1]).toMatchObject({
        uploadMode: UploadMode.DRAFT,
        title: null,
        caption: 'All about the launch',
        options: { shareToFeed: true },
        batchId: result.batchId,
      });
    });

    it('writes nothing when any target is invalid', async () => {
      await expect(
        createService().createBatch(
          userId,
          batchDto([youtubeAccount.id, facebookAccount.id]),
        ),
      ).rejects.toMatchObject({
        response: {
          message: ['@book (Facebook): This platform is not supported yet'],
        },
      });
      expect(videoPostWriter.saveBatch).not.toHaveBeenCalled();
    });

    it('rejects duplicate accounts', async () => {
      await expect(
        createService().createBatch(
          userId,
          batchDto([youtubeAccount.id, youtubeAccount.id]),
        ),
      ).rejects.toThrow(
        new BadRequestException('Each account can only appear once'),
      );
    });

    it("rejects an account the user doesn't own", async () => {
      socialAccountReader.findManyByIdsForUser.mockResolvedValue([
        youtubeAccount,
      ]);

      await expect(
        createService().createBatch(userId, batchDto([youtubeAccount.id, 99])),
      ).rejects.toThrow(new NotFoundException('Social account not found'));
    });

    it('rejects an account that is already scheduled for the video', async () => {
      videoPostReader.findByVideoAndAccounts.mockResolvedValue([
        {
          id: 5,
          socialAccountId: youtubeAccount.id,
          status: PostStatus.SCHEDULED,
        },
      ]);

      await expect(
        createService().createBatch(userId, batchDto([youtubeAccount.id])),
      ).rejects.toMatchObject({
        response: {
          message: ['@chan (YouTube): Already scheduled or publishing'],
        },
      });
      expect(videoPostWriter.saveBatch).not.toHaveBeenCalled();
    });

    it('reuses the newest unscheduled post for the account', async () => {
      videoPostReader.findByVideoAndAccounts.mockResolvedValue([
        {
          id: 8,
          socialAccountId: youtubeAccount.id,
          status: PostStatus.PENDING,
        },
        {
          id: 6,
          socialAccountId: youtubeAccount.id,
          status: PostStatus.PENDING,
        },
        {
          id: 4,
          socialAccountId: youtubeAccount.id,
          status: PostStatus.PUBLISHED,
        },
      ]);

      await createService().createBatch(userId, batchDto([youtubeAccount.id]));

      const { creates, updates } = videoPostWriter.saveBatch.mock.calls[0][0];
      expect(creates).toEqual([]);
      expect(updates).toHaveLength(1);
      expect(updates[0]).toMatchObject({
        id: 8,
        data: { status: PostStatus.SCHEDULED, uploadMode: UploadMode.DRAFT },
      });
    });

    it('rejects a time in the past', async () => {
      await expect(
        createService().createBatch(
          userId,
          batchDto(
            [youtubeAccount.id],
            new Date(Date.now() - 1000).toISOString(),
          ),
        ),
      ).rejects.toThrow(
        new BadRequestException('Scheduled time must be in the future'),
      );
    });

    it('rejects a video that is not ready', async () => {
      videoReader.findOne.mockResolvedValue({
        ...video,
        status: VideoStatus.PROCESSING,
      });

      await expect(
        createService().createBatch(userId, batchDto([youtubeAccount.id])),
      ).rejects.toThrow(
        new BadRequestException('Video is not ready for posting'),
      );
    });
  });

  describe('updateDetails', () => {
    const makeYouTubePost = (status: PostStatus) => ({
      ...makePost(status),
      platform: { name: PlatformType.YOUTUBE },
      video: { userId, title: 'Launch video', description: null },
      uploadMode: UploadMode.DRAFT,
      title: 'Stored title',
      caption: 'Stored caption',
      options: { privacyStatus: 'unlisted', madeForKids: false },
    });

    it('merges new details over the stored ones', async () => {
      videoPostReader.findOne.mockResolvedValue(
        makeYouTubePost(PostStatus.SCHEDULED),
      );
      videoPostWriter.updateIfStatus.mockResolvedValue(1);

      await createService().updateDetails(userId, postId, { caption: 'New' });

      expect(videoPostWriter.updateIfStatus).toHaveBeenCalledWith({
        id: postId,
        allowedStatuses: [PostStatus.PENDING, PostStatus.SCHEDULED],
        data: {
          uploadMode: UploadMode.DRAFT,
          title: 'Stored title',
          caption: 'New',
          options: { privacyStatus: 'unlisted', madeForKids: false },
        },
      });
    });

    it('rejects invalid details', async () => {
      videoPostReader.findOne.mockResolvedValue(
        makeYouTubePost(PostStatus.SCHEDULED),
      );

      await expect(
        createService().updateDetails(userId, postId, {
          options: { tags: ['x'] },
        }),
      ).rejects.toMatchObject({
        response: { message: ['YouTube does not support the "tags" option'] },
      });
      expect(videoPostWriter.updateIfStatus).not.toHaveBeenCalled();
    });

    it('rejects a post that can no longer be edited', async () => {
      videoPostReader.findOne.mockResolvedValue(
        makeYouTubePost(PostStatus.PUBLISHED),
      );
      videoPostWriter.updateIfStatus.mockResolvedValue(0);

      await expect(
        createService().updateDetails(userId, postId, { caption: 'New' }),
      ).rejects.toThrow(
        new BadRequestException('Post can no longer be edited'),
      );
    });
  });
});
