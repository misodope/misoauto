import { PlatformType, UploadMode } from '@backend/generated/prisma/client';
import { VideoPostDetailsService } from './video-post-details.service';

describe('VideoPostDetailsService', () => {
  const service = new VideoPostDetailsService();
  const video = { title: 'My video', description: 'Video description' };

  describe('defaults', () => {
    it.each([
      PlatformType.TIKTOK,
      PlatformType.YOUTUBE,
      PlatformType.INSTAGRAM,
    ])('defaults %s to a draft upload', (platform) => {
      const { details, errors } = service.normalize(platform, {}, video);

      expect(errors).toEqual([]);
      expect(details.uploadMode).toBe(UploadMode.DRAFT);
    });

    it('snapshots YouTube title, description, and options from the video', () => {
      const { details } = service.normalize(PlatformType.YOUTUBE, {}, video);

      expect(details).toEqual({
        uploadMode: UploadMode.DRAFT,
        title: 'My video',
        caption: 'Video description',
        options: { privacyStatus: 'public', madeForKids: false },
      });
    });

    it('snapshots the Instagram caption and shares to feed by default', () => {
      const { details } = service.normalize(PlatformType.INSTAGRAM, {}, video);

      expect(details).toEqual({
        uploadMode: UploadMode.DRAFT,
        title: null,
        caption: 'Video description',
        options: { shareToFeed: true },
      });
    });

    it('leaves the TikTok caption empty and drops the title', () => {
      const { details } = service.normalize(
        PlatformType.TIKTOK,
        { title: 'ignored' },
        video,
      );

      expect(details).toEqual({
        uploadMode: UploadMode.DRAFT,
        title: null,
        caption: null,
        options: {},
      });
    });

    it('truncates a long video title to the YouTube limit', () => {
      const { details, errors } = service.normalize(
        PlatformType.YOUTUBE,
        {},
        { title: 'x'.repeat(150), description: null },
      );

      expect(errors).toEqual([]);
      expect(details.title).toHaveLength(100);
      expect(details.caption).toBeNull();
    });

    it('keeps explicit values over defaults', () => {
      const { details, errors } = service.normalize(
        PlatformType.YOUTUBE,
        {
          uploadMode: UploadMode.DIRECT,
          title: 'Custom',
          caption: 'Custom description',
          options: { privacyStatus: 'unlisted', madeForKids: true },
        },
        video,
      );

      expect(errors).toEqual([]);
      expect(details).toEqual({
        uploadMode: UploadMode.DIRECT,
        title: 'Custom',
        caption: 'Custom description',
        options: { privacyStatus: 'unlisted', madeForKids: true },
      });
    });
  });

  describe('validation', () => {
    it.each<
      [
        string,
        PlatformType,
        Parameters<VideoPostDetailsService['normalize']>[1],
        string,
      ]
    >([
      [
        'TikTok direct posts',
        PlatformType.TIKTOK,
        { uploadMode: UploadMode.DIRECT },
        'TikTok only supports drafts',
      ],
      [
        'long TikTok captions',
        PlatformType.TIKTOK,
        { caption: 'x'.repeat(2201) },
        'TikTok captions must be 2200 characters or fewer',
      ],
      [
        'TikTok options',
        PlatformType.TIKTOK,
        { options: { privacyStatus: 'public' } },
        'TikTok does not support the "privacyStatus" option',
      ],
      [
        'blank YouTube titles',
        PlatformType.YOUTUBE,
        { title: '   ' },
        'YouTube videos require a title',
      ],
      [
        'long YouTube titles',
        PlatformType.YOUTUBE,
        { title: 'x'.repeat(101) },
        'YouTube titles must be 100 characters or fewer',
      ],
      [
        'angle brackets in YouTube titles',
        PlatformType.YOUTUBE,
        { title: 'Hello <world>' },
        'YouTube titles cannot contain < or >',
      ],
      [
        'YouTube descriptions over 5000 bytes',
        PlatformType.YOUTUBE,
        { caption: 'é'.repeat(2501) },
        'YouTube descriptions must be 5000 bytes or fewer',
      ],
      [
        'angle brackets in YouTube descriptions',
        PlatformType.YOUTUBE,
        { caption: 'a < b' },
        'YouTube descriptions cannot contain < or >',
      ],
      [
        'private YouTube privacy',
        PlatformType.YOUTUBE,
        { options: { privacyStatus: 'private' } },
        'YouTube privacy must be public or unlisted',
      ],
      [
        'non-boolean madeForKids',
        PlatformType.YOUTUBE,
        { options: { madeForKids: 'yes' } },
        'YouTube "made for kids" must be true or false',
      ],
      [
        'unknown YouTube options',
        PlatformType.YOUTUBE,
        { options: { tags: ['a'] } },
        'YouTube does not support the "tags" option',
      ],
      [
        'long Instagram captions',
        PlatformType.INSTAGRAM,
        { caption: 'x'.repeat(2201) },
        'Instagram captions must be 2200 characters or fewer',
      ],
      [
        'non-boolean shareToFeed',
        PlatformType.INSTAGRAM,
        { options: { shareToFeed: 'no' } },
        'Instagram "share to feed" must be true or false',
      ],
      [
        'unknown Instagram options',
        PlatformType.INSTAGRAM,
        { options: { coverUrl: 'x' } },
        'Instagram does not support the "coverUrl" option',
      ],
      [
        'Facebook',
        PlatformType.FACEBOOK,
        {},
        'This platform is not supported yet',
      ],
    ])('rejects %s', (_label, platform, input, message) => {
      const { errors } = service.normalize(platform, input, video);

      expect(errors).toContain(message);
    });

    it('flags a video title with angle brackets used as the YouTube default', () => {
      const { errors } = service.normalize(
        PlatformType.YOUTUBE,
        {},
        { title: 'Beta <clip>', description: null },
      );

      expect(errors).toEqual(['YouTube titles cannot contain < or >']);
    });

    it('allows Instagram direct posts', () => {
      const { errors } = service.normalize(
        PlatformType.INSTAGRAM,
        { uploadMode: UploadMode.DIRECT },
        video,
      );

      expect(errors).toEqual([]);
    });
  });
});
