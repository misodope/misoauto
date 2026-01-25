'use client';

import {
  Box,
  Flex,
  Heading,
  Text,
  Switch,
  Separator,
  TextArea,
} from '@radix-ui/themes';

export interface PlatformConfig {
  name: string;
  enabled: boolean;
  caption: string;
}

export interface PlatformSelectionState {
  tiktok: PlatformConfig;
  youtube: PlatformConfig;
  instagram: PlatformConfig;
  facebook: PlatformConfig;
}

export const getDefaultPlatformState = (): PlatformSelectionState => ({
  tiktok: { name: 'TikTok', enabled: false, caption: '' },
  youtube: { name: 'YouTube', enabled: false, caption: '' },
  instagram: { name: 'Instagram', enabled: false, caption: '' },
  facebook: { name: 'Facebook', enabled: false, caption: '' },
});

interface PlatformSelectionProps {
  platforms: PlatformSelectionState;
  onChange: (platforms: PlatformSelectionState) => void;
}

export default function PlatformSelection({
  platforms,
  onChange,
}: PlatformSelectionProps) {
  const handleToggle = (platform: keyof PlatformSelectionState) => {
    onChange({
      ...platforms,
      [platform]: {
        ...platforms[platform],
        enabled: !platforms[platform].enabled,
      },
    });
  };

  const handleCaptionChange = (
    platform: keyof PlatformSelectionState,
    caption: string,
  ) => {
    onChange({
      ...platforms,
      [platform]: {
        ...platforms[platform],
        caption,
      },
    });
  };

  return (
    <Flex direction="column" gap="3">
      {(
        Object.entries(platforms) as [
          keyof PlatformSelectionState,
          PlatformConfig,
        ][]
      ).map(([key, platform]) => (
        <Box
          key={key}
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--gray-2)',
            borderRadius: 'var(--radius-2)',
          }}
        >
          <Flex justify="between" align="center">
            <Flex align="center" gap="2">
              <Text size="2" weight="medium">
                {platform.name}
              </Text>
              <Text size="1" color="gray">
                {platform.enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </Flex>
            <Switch
              size="1"
              checked={platform.enabled}
              onCheckedChange={() => handleToggle(key)}
            />
          </Flex>

          {platform.enabled && (
            <Box mt="3">
              <Separator size="4" mb="3" />
              <Text as="label" size="1" weight="medium" color="gray">
                Caption for {platform.name}
              </Text>
              <TextArea
                size="1"
                placeholder={`Enter caption for ${platform.name}...`}
                value={platform.caption}
                onChange={(e) => handleCaptionChange(key, e.target.value)}
                rows={2}
                mt="1"
              />
            </Box>
          )}
        </Box>
      ))}
    </Flex>
  );
}
