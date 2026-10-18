'use client';

import {
  Box,
  Flex,
  Select,
  Separator,
  Switch,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes';
import { YouTubePublishPrivacyStatus } from '@frontend/app/hooks';

export const YOUTUBE_TITLE_MAX = 100;
export const YOUTUBE_DESCRIPTION_MAX = 5000;

const ANGLE_BRACKETS = /[<>]/;

/** Mirrors the backend's YouTube metadata rules so invalid input is caught early. */
export const isYouTubeMetadataValid = (title: string, description: string) =>
  Boolean(title.trim()) &&
  title.length <= YOUTUBE_TITLE_MAX &&
  !ANGLE_BRACKETS.test(title) &&
  !ANGLE_BRACKETS.test(description);

export interface YouTubeVideoFieldsProps {
  title: string;
  description: string;
  privacyStatus: YouTubePublishPrivacyStatus;
  madeForKids: boolean;
  /** Locks the upload metadata once the video has been sent to YouTube. */
  metadataLocked: boolean;
  privacyLocked: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPrivacyStatusChange: (privacyStatus: YouTubePublishPrivacyStatus) => void;
  onMadeForKidsChange: (madeForKids: boolean) => void;
}

export default function YouTubeVideoFields({
  title,
  description,
  privacyStatus,
  madeForKids,
  metadataLocked,
  privacyLocked,
  onTitleChange,
  onDescriptionChange,
  onPrivacyStatusChange,
  onMadeForKidsChange,
}: YouTubeVideoFieldsProps) {
  const hasAngleBrackets =
    ANGLE_BRACKETS.test(title) || ANGLE_BRACKETS.test(description);

  return (
    <Flex direction="column" gap="3">
      <Box>
        <Flex justify="between" align="center">
          <Text as="label" size="2" weight="medium">
            Title
          </Text>
          <Text size="1" color="gray">
            {title.length}/{YOUTUBE_TITLE_MAX}
          </Text>
        </Flex>
        <TextField.Root
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={YOUTUBE_TITLE_MAX}
          disabled={metadataLocked}
          mt="1"
          placeholder="Video title"
        />
      </Box>
      <Box>
        <Flex justify="between" align="center">
          <Text as="label" size="2" weight="medium">
            Description
          </Text>
          <Text size="1" color="gray">
            {description.length}/{YOUTUBE_DESCRIPTION_MAX}
          </Text>
        </Flex>
        <TextArea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          maxLength={YOUTUBE_DESCRIPTION_MAX}
          disabled={metadataLocked}
          rows={4}
          mt="1"
          placeholder="Tell viewers about your video..."
        />
      </Box>
      {hasAngleBrackets && (
        <Text size="1" color="red">
          YouTube titles and descriptions cannot contain &lt; or &gt;.
        </Text>
      )}
      <Box>
        <Text as="label" size="2" weight="medium">
          Visibility when published
        </Text>
        <Select.Root
          value={privacyStatus}
          onValueChange={(value) =>
            onPrivacyStatusChange(value as YouTubePublishPrivacyStatus)
          }
          disabled={privacyLocked}
        >
          {/* Select.Trigger has no width prop, matching the Platform select. */}
          <Select.Trigger style={{ width: '100%' }} mt="1" />
          <Select.Content>
            <Select.Item value="public">Public</Select.Item>
            <Select.Item value="unlisted">Unlisted</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>
      <Separator size="4" />
      <Flex justify="between" align="center" gap="3">
        <Flex direction="column">
          <Text size="2">Made for kids</Text>
          <Text size="1" color="gray">
            Required by YouTube for COPPA compliance
          </Text>
        </Flex>
        <Switch
          checked={madeForKids}
          onCheckedChange={onMadeForKidsChange}
          disabled={metadataLocked}
        />
      </Flex>
    </Flex>
  );
}
