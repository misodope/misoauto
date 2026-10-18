'use client';

import { Box, Flex, Separator, Switch, Text, TextArea } from '@radix-ui/themes';

export const INSTAGRAM_CAPTION_MAX = 2200;

export interface InstagramReelFieldsProps {
  caption: string;
  shareToFeed: boolean;
  onCaptionChange: (caption: string) => void;
  onShareToFeedChange: (shareToFeed: boolean) => void;
}

export default function InstagramReelFields({
  caption,
  shareToFeed,
  onCaptionChange,
  onShareToFeedChange,
}: InstagramReelFieldsProps) {
  return (
    <Box>
      <Flex justify="between" align="center">
        <Text as="label" size="2" weight="medium">
          Caption
        </Text>
        <Text size="1" color="gray">
          {caption.length}/{INSTAGRAM_CAPTION_MAX}
        </Text>
      </Flex>
      <TextArea
        value={caption}
        onChange={(event) => onCaptionChange(event.target.value)}
        maxLength={INSTAGRAM_CAPTION_MAX}
        rows={4}
        mt="1"
        placeholder="Write a caption for your Reel..."
      />
      <Separator size="4" my="3" />
      <Flex justify="between" align="center">
        <Text size="2">Also share to feed</Text>
        <Switch checked={shareToFeed} onCheckedChange={onShareToFeedChange} />
      </Flex>
    </Box>
  );
}
