import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PostStatus } from '@backend/generated/prisma/client';
import { VideoPostsService } from './video-posts.service';

describe('VideoPostsService', () => {
  const userId = 7;
  const postId = 42;

  const videoPostReader = {
    findOne: jest.fn(),
  };
  const videoPostWriter = {
    updateIfStatus: jest.fn(),
  };
  const videoReader = {
    findOne: jest.fn(),
  };
  const socialAccountReader = {
    findOne: jest.fn(),
  };

  const createService = () =>
    new VideoPostsService(
      videoPostReader as never,
      videoPostWriter as never,
      videoReader as never,
      socialAccountReader as never,
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
});
