'use client';

import { Box, Flex, RadioCards, Text } from '@radix-ui/themes';

export type UploadMode = 'draft' | 'direct';

export interface UploadModeSelectorProps {
  value: UploadMode;
  onChange: (mode: UploadMode) => void;
  draftLabel: string;
  draftDescription: string;
  directDescription: string;
  directDisabled: boolean;
}

export default function UploadModeSelector({
  value,
  onChange,
  draftLabel,
  draftDescription,
  directDescription,
  directDisabled,
}: UploadModeSelectorProps) {
  return (
    <Box>
      <Text as="label" size="2" weight="medium" mb="1">
        Upload Type
      </Text>
      <RadioCards.Root
        value={value}
        onValueChange={(mode) => onChange(mode as UploadMode)}
        columns="2"
        mt="1"
      >
        <RadioCards.Item value="draft">
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {draftLabel}
            </Text>
            <Text size="1" color="gray">
              {draftDescription}
            </Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="direct" disabled={directDisabled}>
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              Direct
            </Text>
            <Text size="1" color="gray">
              {directDescription}
            </Text>
          </Flex>
        </RadioCards.Item>
      </RadioCards.Root>
    </Box>
  );
}
