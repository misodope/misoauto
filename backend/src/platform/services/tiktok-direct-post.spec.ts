import {
  TikTokApiException,
  TikTokCreatorInfo,
  TikTokDirectPostOptions,
  assertTikTokOk,
  toTikTokApiException,
  toTikTokPostInfo,
  validateTikTokDirectPost,
} from './tiktok-direct-post';

const creatorInfo: TikTokCreatorInfo = {
  creator_avatar_url: 'https://example.com/a.jpg',
  creator_username: 'miso',
  creator_nickname: 'Miso',
  privacy_level_options: [
    'PUBLIC_TO_EVERYONE',
    'MUTUAL_FOLLOW_FRIENDS',
    'SELF_ONLY',
  ],
  comment_disabled: false,
  duet_disabled: false,
  stitch_disabled: false,
  max_video_post_duration_sec: 600,
};

const options: TikTokDirectPostOptions = {
  privacyLevel: 'PUBLIC_TO_EVERYONE',
  allowComment: false,
  allowDuet: false,
  allowStitch: false,
  isAigc: false,
  brandOrganic: false,
  brandContent: false,
};

describe('validateTikTokDirectPost', () => {
  const validate = (
    overrides: Partial<TikTokDirectPostOptions> = {},
    extra: {
      caption?: string;
      videoDurationSec?: number | null;
      creatorInfo?: Partial<TikTokCreatorInfo>;
    } = {},
  ) =>
    validateTikTokDirectPost({
      caption: extra.caption ?? 'Hello #miso',
      options: { ...options, ...overrides },
      creatorInfo: { ...creatorInfo, ...extra.creatorInfo },
      videoDurationSec:
        extra.videoDurationSec === undefined ? 30 : extra.videoDurationSec,
    });

  it('accepts a valid post', () => {
    expect(validate()).toEqual([]);
  });

  it('rejects a privacy level the creator cannot use', () => {
    expect(validate({ privacyLevel: 'FOLLOWER_OF_CREATOR' })).toEqual([
      'That visibility option is not available for this TikTok account',
    ]);
  });

  it('rejects private branded content', () => {
    expect(validate({ privacyLevel: 'SELF_ONLY', brandContent: true })).toEqual(
      ['Branded content visibility cannot be set to private'],
    );
  });

  it('allows private posts promoting your own brand', () => {
    expect(validate({ privacyLevel: 'SELF_ONLY', brandOrganic: true })).toEqual(
      [],
    );
  });

  it('rejects videos longer than the creator can post', () => {
    expect(validate({}, { videoDurationSec: 601 })).toEqual([
      'This account can post videos up to 600 seconds long',
    ]);
  });

  it('skips the duration check when the duration is unknown', () => {
    expect(validate({}, { videoDurationSec: null })).toEqual([]);
  });

  it('rejects captions over 2200 characters', () => {
    expect(validate({}, { caption: 'a'.repeat(2201) })).toEqual([
      'TikTok captions must be 2200 characters or fewer',
    ]);
  });

  it('rejects a cover frame past the end of the video', () => {
    expect(validate({ coverTimestampMs: 31_000 })).toEqual([
      'The cover frame must be within the video',
    ]);
  });
});

describe('toTikTokPostInfo', () => {
  it('turns allow flags into disable flags', () => {
    expect(
      toTikTokPostInfo(
        'Caption',
        { ...options, allowComment: true, coverTimestampMs: 1500 },
        creatorInfo,
      ),
    ).toEqual({
      title: 'Caption',
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_comment: false,
      disable_duet: true,
      disable_stitch: true,
      brand_content_toggle: false,
      brand_organic_toggle: false,
      is_aigc: false,
      video_cover_timestamp_ms: 1500,
    });
  });

  it('keeps interactions off when the creator disabled them', () => {
    const info = toTikTokPostInfo(
      null,
      { ...options, allowComment: true, allowDuet: true, allowStitch: true },
      { ...creatorInfo, comment_disabled: true, duet_disabled: true },
    );
    expect(info.disable_comment).toBe(true);
    expect(info.disable_duet).toBe(true);
    expect(info.disable_stitch).toBe(false);
    expect(info).not.toHaveProperty('title');
  });
});

describe('TikTok error mapping', () => {
  it('maps known error codes to friendly messages', () => {
    expect(() =>
      assertTikTokOk({
        error: { code: 'spam_risk_too_many_posts', message: 'x', log_id: 'l1' },
      }),
    ).toThrow("This TikTok account has reached TikTok's daily posting limit");
  });

  it('passes ok responses', () => {
    expect(() => assertTikTokOk({ error: { code: 'ok' } })).not.toThrow();
  });

  it('keeps the TikTok code from axios errors', () => {
    const exception = toTikTokApiException(
      {
        isAxiosError: true,
        response: {
          data: { error: { code: 'scope_not_authorized', log_id: 'l2' } },
        },
      },
      'fallback',
    );
    expect(exception).toBeInstanceOf(TikTokApiException);
    expect(exception.tiktokCode).toBe('scope_not_authorized');
    expect(exception.getResponse()).toMatchObject({
      tiktokCode: 'scope_not_authorized',
      message: expect.stringContaining('Reconnect'),
    });
  });

  it('falls back for unknown errors', () => {
    expect(toTikTokApiException(new Error('boom'), 'fallback').message).toBe(
      'fallback',
    );
  });
});
