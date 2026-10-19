import { BadRequestException } from '@nestjs/common';
import { AxiosError } from 'axios';

// Rules come from TikTok's Direct Post reference and Content Sharing
// Guidelines: https://developers.tiktok.com/doc/content-sharing-guidelines

export const TIKTOK_CAPTION_MAX_LENGTH = 2200;

export const TIKTOK_PRIVACY_LEVELS = [
  'PUBLIC_TO_EVERYONE',
  'MUTUAL_FOLLOW_FRIENDS',
  'FOLLOWER_OF_CREATOR',
  'SELF_ONLY',
] as const;

export type TikTokPrivacyLevel = (typeof TIKTOK_PRIVACY_LEVELS)[number];

export interface TikTokCreatorInfo {
  creator_avatar_url: string;
  creator_username: string;
  creator_nickname: string;
  privacy_level_options: TikTokPrivacyLevel[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
}

/**
 * What the user chose on the Post to TikTok screen. Interactions are stored as
 * "allow" flags (all off by default, as TikTok requires) and only flipped to
 * TikTok's `disable_*` fields at the API boundary.
 */
export interface TikTokDirectPostOptions {
  privacyLevel: TikTokPrivacyLevel;
  allowComment: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  isAigc: boolean;
  brandOrganic: boolean;
  brandContent: boolean;
  coverTimestampMs?: number;
}

export interface TikTokPostInfo {
  title?: string;
  privacy_level: TikTokPrivacyLevel;
  disable_comment: boolean;
  disable_duet: boolean;
  disable_stitch: boolean;
  brand_content_toggle: boolean;
  brand_organic_toggle: boolean;
  is_aigc: boolean;
  video_cover_timestamp_ms?: number;
}

/**
 * Checks a Direct Post against the creator's current settings. Runs right
 * before every post so a stale form never sends values TikTok would reject
 * (repeated `privacy_level_option_mismatch` errors are flagged as misuse).
 */
export function validateTikTokDirectPost(params: {
  caption: string | null | undefined;
  options: TikTokDirectPostOptions;
  creatorInfo: TikTokCreatorInfo;
  videoDurationSec: number | null | undefined;
}): string[] {
  const { caption, options, creatorInfo, videoDurationSec } = params;
  const errors: string[] = [];

  if (caption && caption.length > TIKTOK_CAPTION_MAX_LENGTH) {
    errors.push(
      `TikTok captions must be ${TIKTOK_CAPTION_MAX_LENGTH} characters or fewer`,
    );
  }

  if (!creatorInfo.privacy_level_options.includes(options.privacyLevel)) {
    errors.push(
      'That visibility option is not available for this TikTok account',
    );
  }

  if (options.brandContent && options.privacyLevel === 'SELF_ONLY') {
    errors.push('Branded content visibility cannot be set to private');
  }

  if (
    videoDurationSec != null &&
    creatorInfo.max_video_post_duration_sec > 0 &&
    videoDurationSec > creatorInfo.max_video_post_duration_sec
  ) {
    errors.push(
      `This account can post videos up to ${creatorInfo.max_video_post_duration_sec} seconds long`,
    );
  }

  if (
    options.coverTimestampMs != null &&
    videoDurationSec != null &&
    options.coverTimestampMs > videoDurationSec * 1000
  ) {
    errors.push('The cover frame must be within the video');
  }

  return errors;
}

export function toTikTokPostInfo(
  caption: string | null | undefined,
  options: TikTokDirectPostOptions,
  creatorInfo: TikTokCreatorInfo,
): TikTokPostInfo {
  return {
    ...(caption ? { title: caption } : {}),
    privacy_level: options.privacyLevel,
    // Settings the creator turned off in TikTok stay off whatever was sent.
    disable_comment: !options.allowComment || creatorInfo.comment_disabled,
    disable_duet: !options.allowDuet || creatorInfo.duet_disabled,
    disable_stitch: !options.allowStitch || creatorInfo.stitch_disabled,
    brand_content_toggle: options.brandContent,
    brand_organic_toggle: options.brandOrganic,
    is_aigc: options.isAigc,
    ...(options.coverTimestampMs != null
      ? { video_cover_timestamp_ms: options.coverTimestampMs }
      : {}),
  };
}

const TIKTOK_ERROR_MESSAGES: Record<string, string> = {
  scope_not_authorized:
    'Reconnect your TikTok account to allow posting directly to TikTok.',
  access_token_invalid:
    'Your TikTok connection has expired. Reconnect your TikTok account.',
  unaudited_client_can_only_post_to_private_accounts:
    'Until this app is approved by TikTok, direct posts only work on private TikTok accounts. Set your account to private or send a draft instead.',
  spam_risk_too_many_posts:
    "This TikTok account has reached TikTok's daily posting limit. Try again tomorrow.",
  spam_risk_user_banned_from_posting:
    'TikTok has blocked this account from posting.',
  reached_active_user_cap:
    'TikTok posting is temporarily unavailable. Try again later.',
  privacy_level_option_mismatch:
    'That visibility option is not available for this TikTok account.',
  url_ownership_unverified:
    'TikTok could not verify the video URL. Contact support.',
  rate_limit_exceeded:
    'Too many requests to TikTok. Wait a minute and try again.',
};

/** TikTok error codes that mean the post is blocked until something changes. */
export const TIKTOK_POSTING_BLOCKED_CODES = [
  'spam_risk_too_many_posts',
  'spam_risk_user_banned_from_posting',
  'reached_active_user_cap',
];

export interface TikTokErrorBody {
  code?: string;
  message?: string;
  log_id?: string;
}

/** A TikTok API failure with TikTok's error code kept for the client. */
export class TikTokApiException extends BadRequestException {
  constructor(
    message: string,
    readonly tiktokCode?: string,
    readonly logId?: string,
  ) {
    super({ message, tiktokCode, statusCode: 400, error: 'Bad Request' });
  }
}

export function tiktokErrorMessage(
  error: TikTokErrorBody | undefined,
  fallback: string,
): string {
  if (!error?.code) return fallback;
  return (
    TIKTOK_ERROR_MESSAGES[error.code] ??
    (error.message ? `TikTok API error: ${error.message}` : fallback)
  );
}

/** Throws when a TikTok response body carries a non-ok error code. */
export function assertTikTokOk(data: { error?: TikTokErrorBody }): void {
  const error = data?.error;
  if (error?.code && error.code !== 'ok') {
    throw new TikTokApiException(
      tiktokErrorMessage(error, 'TikTok request failed'),
      error.code,
      error.log_id,
    );
  }
}

/** Normalizes anything thrown during a TikTok call into a TikTokApiException. */
export function toTikTokApiException(
  error: unknown,
  fallback: string,
): TikTokApiException {
  if (error instanceof TikTokApiException) return error;
  // Checked by flag rather than axios.isAxiosError so specs can mock axios.
  if ((error as AxiosError | undefined)?.isAxiosError) {
    const body = (error as AxiosError<{ error?: TikTokErrorBody }>).response
      ?.data?.error;
    if (body?.code) {
      return new TikTokApiException(
        tiktokErrorMessage(body, fallback),
        body.code,
        body.log_id,
      );
    }
  }
  return new TikTokApiException(fallback);
}
