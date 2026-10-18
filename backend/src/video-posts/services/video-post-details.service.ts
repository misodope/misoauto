import { Injectable } from '@nestjs/common';
import { PlatformType, UploadMode } from '@backend/generated/prisma/client';

// Limits mirror PlatformConnectYouTubeService.validateYouTubeVideo
// (platform/services/platform-connect-youtube.service.ts). Keep in sync.
const YOUTUBE_TITLE_MAX_LENGTH = 100;
const YOUTUBE_DESCRIPTION_MAX_BYTES = 5000;
const INSTAGRAM_CAPTION_MAX_LENGTH = 2200;
const TIKTOK_CAPTION_MAX_LENGTH = 2200;
const ANGLE_BRACKETS = /[<>]/;
const YOUTUBE_PRIVACY_STATUSES = ['public', 'unlisted'];

export interface VideoPostDetailsInput {
  uploadMode?: UploadMode | null;
  title?: string | null;
  caption?: string | null;
  options?: Record<string, unknown> | null;
}

export interface NormalizedVideoPostDetails {
  uploadMode: UploadMode;
  title: string | null;
  caption: string | null;
  options: Record<string, unknown>;
}

export interface NormalizeVideoPostDetailsResult {
  details: NormalizedVideoPostDetails;
  errors: string[];
}

interface VideoDefaults {
  title: string;
  description: string | null;
}

/**
 * Applies each platform's defaults to the post details a user entered and
 * reports anything the platform would reject. Every platform defaults to a
 * draft upload, so nothing goes live without an explicit choice.
 */
@Injectable()
export class VideoPostDetailsService {
  normalize(
    platform: PlatformType,
    input: VideoPostDetailsInput,
    video: VideoDefaults,
  ): NormalizeVideoPostDetailsResult {
    switch (platform) {
      case PlatformType.TIKTOK:
        return this.normalizeTikTok(input);
      case PlatformType.YOUTUBE:
        return this.normalizeYouTube(input, video);
      case PlatformType.INSTAGRAM:
        return this.normalizeInstagram(input, video);
      default:
        return {
          details: {
            uploadMode: input.uploadMode ?? UploadMode.DRAFT,
            title: null,
            caption: null,
            options: {},
          },
          errors: ['This platform is not supported yet'],
        };
    }
  }

  private normalizeTikTok(
    input: VideoPostDetailsInput,
  ): NormalizeVideoPostDetailsResult {
    const errors: string[] = [];
    const uploadMode = input.uploadMode ?? UploadMode.DRAFT;
    if (uploadMode !== UploadMode.DRAFT) {
      errors.push('TikTok only supports drafts');
    }

    const caption = input.caption ?? null;
    if (caption && caption.length > TIKTOK_CAPTION_MAX_LENGTH) {
      errors.push(
        `TikTok captions must be ${TIKTOK_CAPTION_MAX_LENGTH} characters or fewer`,
      );
    }

    const options = input.options ?? {};
    errors.push(...this.unknownOptionErrors('TikTok', options, []));

    return {
      details: { uploadMode, title: null, caption, options: {} },
      errors,
    };
  }

  private normalizeYouTube(
    input: VideoPostDetailsInput,
    video: VideoDefaults,
  ): NormalizeVideoPostDetailsResult {
    const errors: string[] = [];
    const uploadMode = input.uploadMode ?? UploadMode.DRAFT;

    const title = (
      input.title ?? video.title.slice(0, YOUTUBE_TITLE_MAX_LENGTH)
    ).trim();
    if (!title) {
      errors.push('YouTube videos require a title');
    } else if (title.length > YOUTUBE_TITLE_MAX_LENGTH) {
      errors.push(
        `YouTube titles must be ${YOUTUBE_TITLE_MAX_LENGTH} characters or fewer`,
      );
    }
    if (ANGLE_BRACKETS.test(title)) {
      errors.push('YouTube titles cannot contain < or >');
    }

    const caption = input.caption ?? video.description ?? null;
    if (
      caption &&
      Buffer.byteLength(caption, 'utf8') > YOUTUBE_DESCRIPTION_MAX_BYTES
    ) {
      errors.push(
        `YouTube descriptions must be ${YOUTUBE_DESCRIPTION_MAX_BYTES} bytes or fewer`,
      );
    }
    if (caption && ANGLE_BRACKETS.test(caption)) {
      errors.push('YouTube descriptions cannot contain < or >');
    }

    const options = input.options ?? {};
    errors.push(
      ...this.unknownOptionErrors('YouTube', options, [
        'privacyStatus',
        'madeForKids',
      ]),
    );

    const privacyStatus = options.privacyStatus ?? 'public';
    if (
      typeof privacyStatus !== 'string' ||
      !YOUTUBE_PRIVACY_STATUSES.includes(privacyStatus)
    ) {
      errors.push('YouTube privacy must be public or unlisted');
    }

    const madeForKids = options.madeForKids ?? false;
    if (typeof madeForKids !== 'boolean') {
      errors.push('YouTube "made for kids" must be true or false');
    }

    return {
      details: {
        uploadMode,
        title: title || null,
        caption,
        options: { privacyStatus, madeForKids },
      },
      errors,
    };
  }

  private normalizeInstagram(
    input: VideoPostDetailsInput,
    video: VideoDefaults,
  ): NormalizeVideoPostDetailsResult {
    const errors: string[] = [];
    // A scheduled Instagram draft prepares the Reel at the scheduled time
    // without posting it; the user then has 24h to publish.
    const uploadMode = input.uploadMode ?? UploadMode.DRAFT;

    const caption = input.caption ?? video.description ?? null;
    if (caption && caption.length > INSTAGRAM_CAPTION_MAX_LENGTH) {
      errors.push(
        `Instagram captions must be ${INSTAGRAM_CAPTION_MAX_LENGTH} characters or fewer`,
      );
    }

    const options = input.options ?? {};
    errors.push(
      ...this.unknownOptionErrors('Instagram', options, ['shareToFeed']),
    );

    const shareToFeed = options.shareToFeed ?? true;
    if (typeof shareToFeed !== 'boolean') {
      errors.push('Instagram "share to feed" must be true or false');
    }

    return {
      details: { uploadMode, title: null, caption, options: { shareToFeed } },
      errors,
    };
  }

  private unknownOptionErrors(
    platformLabel: string,
    options: Record<string, unknown>,
    allowedKeys: string[],
  ): string[] {
    return Object.keys(options)
      .filter((key) => !allowedKeys.includes(key))
      .map((key) => `${platformLabel} does not support the "${key}" option`);
  }
}
