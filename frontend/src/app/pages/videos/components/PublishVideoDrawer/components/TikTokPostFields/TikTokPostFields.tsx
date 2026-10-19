'use client';

import { useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Callout,
  Checkbox,
  Flex,
  Link,
  Select,
  Separator,
  Skeleton,
  Switch,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes';
import { CopyIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import {
  TikTokCreatorInfo,
  TikTokPrivacyLevel,
} from '@frontend/app/hooks/apis/integrations/use-integrations';
import { UploadMode } from '../UploadModeSelector';

// UX rules follow TikTok's Content Sharing Guidelines, which the app audit
// checks: https://developers.tiktok.com/doc/content-sharing-guidelines

export const TIKTOK_CAPTION_MAX = 2200;

const MUSIC_USAGE_URL =
  'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
const BRANDED_CONTENT_POLICY_URL =
  'https://www.tiktok.com/legal/page/global/bc-policy/en';

const PRIVACY_LABEL: Record<TikTokPrivacyLevel, string> = {
  PUBLIC_TO_EVERYONE: 'Everyone',
  MUTUAL_FOLLOW_FRIENDS: 'Friends',
  FOLLOWER_OF_CREATOR: 'Followers',
  SELF_ONLY: 'Only me',
};

export const DISCLOSURE_REQUIRED_MESSAGE =
  'You need to indicate if your content promotes yourself, a third party, or both.';

export interface TikTokPostFieldsValue {
  caption: string;
  /** No default: TikTok requires the user to pick visibility themselves. */
  privacyLevel: TikTokPrivacyLevel | null;
  allowComment: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  coverTimestampMs: number | null;
  isAigc: boolean;
  commercialDisclosure: boolean;
  brandOrganic: boolean;
  brandContent: boolean;
}

export const DEFAULT_TIKTOK_POST_FIELDS: TikTokPostFieldsValue = {
  caption: '',
  privacyLevel: null,
  allowComment: false,
  allowDuet: false,
  allowStitch: false,
  coverTimestampMs: null,
  isAigc: false,
  commercialDisclosure: false,
  brandOrganic: false,
  brandContent: false,
};

/**
 * Why a Direct Post can't be sent yet, or null when it can. Mirrors the
 * backend checks in platform/services/tiktok-direct-post.ts.
 */
export function getTikTokDirectPostBlocker(
  value: TikTokPostFieldsValue,
  creatorInfo: TikTokCreatorInfo | undefined,
  videoDurationSec: number | null,
): string | null {
  if (!creatorInfo) return 'Loading your TikTok account settings…';
  if (
    videoDurationSec != null &&
    creatorInfo.max_video_post_duration_sec > 0 &&
    videoDurationSec > creatorInfo.max_video_post_duration_sec
  ) {
    return `This account can post videos up to ${creatorInfo.max_video_post_duration_sec} seconds long.`;
  }
  if (value.caption.length > TIKTOK_CAPTION_MAX) {
    return `TikTok captions must be ${TIKTOK_CAPTION_MAX} characters or fewer.`;
  }
  if (!value.privacyLevel) return 'Choose who can view this video.';
  if (
    !creatorInfo.privacy_level_options.includes(value.privacyLevel) ||
    (value.brandContent && value.privacyLevel === 'SELF_ONLY')
  ) {
    return 'Choose a different visibility option.';
  }
  if (
    value.commercialDisclosure &&
    !value.brandOrganic &&
    !value.brandContent
  ) {
    return DISCLOSURE_REQUIRED_MESSAGE;
  }
  return null;
}

export interface TikTokPostFieldsProps {
  value: TikTokPostFieldsValue;
  onChange: (value: TikTokPostFieldsValue) => void;
  mode: UploadMode;
  creatorInfo: TikTokCreatorInfo | undefined;
  creatorInfoLoading: boolean;
  /** A creator info error, e.g. the account needs to be reconnected. */
  creatorInfoError: string | null;
  previewUrl: string | null;
  videoDurationSec: number | null;
  /** Locks the inputs once the post has been sent to TikTok. */
  locked: boolean;
  /** Until TikTok's app audit passes, every Direct Post is private. */
  showUnauditedNotice: boolean;
  onCopyCaption: () => void;
}

export default function TikTokPostFields({
  value,
  onChange,
  mode,
  creatorInfo,
  creatorInfoLoading,
  creatorInfoError,
  previewUrl,
  videoDurationSec,
  locked,
  showUnauditedNotice,
  onCopyCaption,
}: TikTokPostFieldsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const update = (patch: Partial<TikTokPostFieldsValue>) =>
    onChange({ ...value, ...patch });

  const captionField = (
    <Box>
      <Flex justify="between" align="center">
        <Text as="label" size="2" weight="medium">
          Caption
        </Text>
        <Text size="1" color="gray">
          {value.caption.length}/{TIKTOK_CAPTION_MAX}
        </Text>
      </Flex>
      <TextArea
        value={value.caption}
        onChange={(event) => update({ caption: event.target.value })}
        maxLength={TIKTOK_CAPTION_MAX}
        disabled={locked}
        rows={4}
        mt="1"
        placeholder="Write a caption… #hashtags @mentions"
      />
    </Box>
  );

  // TikTok's inbox upload doesn't accept a caption or settings, so the user
  // adds them in the TikTok app.
  if (mode === 'draft') {
    return (
      <Flex direction="column" gap="2">
        {captionField}
        <Flex justify="between" align="center" gap="3">
          <Text size="1" color="gray">
            TikTok doesn&apos;t receive captions for drafts. Copy it now and
            paste it in the TikTok app.
          </Text>
          <Button
            variant="soft"
            size="1"
            onClick={onCopyCaption}
            disabled={!value.caption.trim()}
          >
            <CopyIcon /> Copy caption
          </Button>
        </Flex>
      </Flex>
    );
  }

  if (creatorInfoError) {
    return (
      <Callout.Root color="red">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>{creatorInfoError}</Callout.Text>
      </Callout.Root>
    );
  }

  const durationTooLong =
    !!creatorInfo &&
    videoDurationSec != null &&
    creatorInfo.max_video_post_duration_sec > 0 &&
    videoDurationSec > creatorInfo.max_video_post_duration_sec;
  const privacyOptions = creatorInfo?.privacy_level_options ?? [];
  const interactions = [
    {
      key: 'allowComment' as const,
      label: 'Comment',
      disabledByCreator: creatorInfo?.comment_disabled ?? false,
    },
    {
      key: 'allowDuet' as const,
      label: 'Duet',
      disabledByCreator: creatorInfo?.duet_disabled ?? false,
    },
    {
      key: 'allowStitch' as const,
      label: 'Stitch',
      disabledByCreator: creatorInfo?.stitch_disabled ?? false,
    },
  ];
  const disclosureLabel = value.brandContent
    ? "Your video will be labeled as 'Paid partnership'"
    : value.brandOrganic
      ? "Your video will be labeled as 'Promotional content'"
      : null;
  const disclosureIncomplete =
    value.commercialDisclosure && !value.brandOrganic && !value.brandContent;

  const handleBrandContentChange = (checked: boolean) => {
    // Branded content can't be private, so clear an "Only me" choice.
    update({
      brandContent: checked,
      ...(checked && value.privacyLevel === 'SELF_ONLY'
        ? { privacyLevel: null }
        : {}),
    });
  };

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        {creatorInfoLoading || !creatorInfo ? (
          <>
            <Skeleton width="32px" height="32px" />
            <Skeleton width="160px" height="16px" />
          </>
        ) : (
          <>
            <Avatar
              size="2"
              radius="full"
              src={creatorInfo.creator_avatar_url}
              fallback={creatorInfo.creator_nickname.slice(0, 1)}
            />
            <Text size="2">
              Posting to{' '}
              <Text weight="medium">{creatorInfo.creator_nickname}</Text>{' '}
              <Text color="gray">@{creatorInfo.creator_username}</Text>
            </Text>
          </>
        )}
      </Flex>

      {showUnauditedNotice && (
        <Callout.Root color="yellow" size="1">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Until TikTok approves MisoAuto, direct posts are visible only to you
            and your TikTok account must be set to private.
          </Callout.Text>
        </Callout.Root>
      )}

      {previewUrl && (
        <video
          ref={videoRef}
          src={previewUrl}
          controls
          muted
          playsInline
          preload="metadata"
          style={{
            width: '100%',
            maxHeight: 280,
            borderRadius: 'var(--radius-3)',
            background: 'var(--gray-a3)',
          }}
        />
      )}

      {durationTooLong && creatorInfo && (
        <Text size="1" color="red">
          This video is longer than the{' '}
          {creatorInfo.max_video_post_duration_sec} seconds this account can
          post.
        </Text>
      )}

      {captionField}

      <Box>
        <Text as="label" size="2" weight="medium">
          Who can view this video
        </Text>
        <Select.Root
          value={value.privacyLevel ?? ''}
          onValueChange={(privacyLevel) =>
            update({ privacyLevel: privacyLevel as TikTokPrivacyLevel })
          }
          disabled={locked || !creatorInfo}
        >
          {/* Select.Trigger has no width prop, matching the Platform select. */}
          <Select.Trigger
            placeholder="Select visibility…"
            style={{ width: '100%' }}
            mt="1"
          />
          <Select.Content>
            {privacyOptions.map((option) => (
              <Select.Item
                key={option}
                value={option}
                disabled={value.brandContent && option === 'SELF_ONLY'}
              >
                {PRIVACY_LABEL[option]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        {value.brandContent && privacyOptions.includes('SELF_ONLY') && (
          <Text as="p" size="1" color="gray" mt="1">
            Branded content visibility cannot be set to private.
          </Text>
        )}
      </Box>

      <Box>
        <Text as="p" size="2" weight="medium">
          Allow users to
        </Text>
        <Flex gap="4" mt="1" wrap="wrap">
          {interactions.map(({ key, label, disabledByCreator }) => (
            <Text
              as="label"
              size="2"
              key={key}
              color={disabledByCreator ? 'gray' : undefined}
              title={
                disabledByCreator
                  ? 'Turned off in your TikTok settings'
                  : undefined
              }
            >
              <Flex gap="2" align="center">
                <Checkbox
                  checked={value[key] && !disabledByCreator}
                  onCheckedChange={(checked) =>
                    update({ [key]: checked === true })
                  }
                  disabled={locked || disabledByCreator || !creatorInfo}
                />
                {label}
              </Flex>
            </Text>
          ))}
        </Flex>
      </Box>

      <Box>
        <Flex justify="between" align="center">
          <Text as="label" size="2" weight="medium">
            Cover frame
          </Text>
          {previewUrl && (
            <Button
              variant="ghost"
              size="1"
              disabled={locked}
              onClick={() => {
                const seconds = videoRef.current?.currentTime ?? 0;
                update({ coverTimestampMs: Math.round(seconds * 1000) });
              }}
            >
              Use current preview frame
            </Button>
          )}
        </Flex>
        <TextField.Root
          type="number"
          min={0}
          max={videoDurationSec ?? undefined}
          step={0.1}
          value={
            value.coverTimestampMs == null ? '' : value.coverTimestampMs / 1000
          }
          onChange={(event) => {
            const seconds = event.target.value;
            update({
              coverTimestampMs:
                seconds === ''
                  ? null
                  : Math.max(0, Math.round(Number(seconds) * 1000)),
            });
          }}
          disabled={locked}
          mt="1"
          placeholder="First frame"
        >
          <TextField.Slot side="right">
            <Text size="1" color="gray">
              seconds
            </Text>
          </TextField.Slot>
        </TextField.Root>
      </Box>

      <Separator size="4" />

      <Flex justify="between" align="center" gap="3">
        <Flex direction="column">
          <Text size="2">AI-generated content</Text>
          <Text size="1" color="gray">
            Adds TikTok&apos;s AI-generated label to the video
          </Text>
        </Flex>
        <Switch
          checked={value.isAigc}
          onCheckedChange={(isAigc) => update({ isAigc })}
          disabled={locked}
        />
      </Flex>

      <Box>
        <Flex justify="between" align="center" gap="3">
          <Flex direction="column">
            <Text size="2">Disclose video content</Text>
            <Text size="1" color="gray">
              Turn on if this video promotes goods or services in exchange for
              something of value
            </Text>
          </Flex>
          <Switch
            checked={value.commercialDisclosure}
            onCheckedChange={(commercialDisclosure) =>
              update({
                commercialDisclosure,
                ...(commercialDisclosure
                  ? {}
                  : { brandOrganic: false, brandContent: false }),
              })
            }
            disabled={locked}
          />
        </Flex>
        {value.commercialDisclosure && (
          <Flex direction="column" gap="2" mt="2" pl="2">
            <Text as="label" size="2">
              <Flex gap="2" align="start">
                <Checkbox
                  checked={value.brandOrganic}
                  onCheckedChange={(checked) =>
                    update({ brandOrganic: checked === true })
                  }
                  disabled={locked}
                />
                <Flex direction="column">
                  <Text>Your brand</Text>
                  <Text size="1" color="gray">
                    You are promoting yourself or your own business
                  </Text>
                </Flex>
              </Flex>
            </Text>
            <Text as="label" size="2">
              <Flex gap="2" align="start">
                <Checkbox
                  checked={value.brandContent}
                  onCheckedChange={(checked) =>
                    handleBrandContentChange(checked === true)
                  }
                  disabled={locked}
                />
                <Flex direction="column">
                  <Text>Branded content</Text>
                  <Text size="1" color="gray">
                    You are promoting another brand or a third party
                  </Text>
                </Flex>
              </Flex>
            </Text>
            {disclosureLabel && (
              <Text size="1" color="gray">
                {disclosureLabel}
              </Text>
            )}
            {disclosureIncomplete && (
              <Text size="1" color="red">
                {DISCLOSURE_REQUIRED_MESSAGE}
              </Text>
            )}
          </Flex>
        )}
      </Box>

      <Text size="1" color="gray">
        By posting, you agree to TikTok&apos;s{' '}
        {value.brandContent && (
          <>
            <Link
              href={BRANDED_CONTENT_POLICY_URL}
              target="_blank"
              rel="noreferrer"
            >
              Branded Content Policy
            </Link>{' '}
            and{' '}
          </>
        )}
        <Link href={MUSIC_USAGE_URL} target="_blank" rel="noreferrer">
          Music Usage Confirmation
        </Link>
        .
      </Text>
    </Flex>
  );
}
