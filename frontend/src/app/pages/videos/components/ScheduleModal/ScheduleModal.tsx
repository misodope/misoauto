'use client';

import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  TextArea,
  TextField,
  Switch,
  Separator,
  ScrollArea,
} from '@radix-ui/themes';
import Modal from '@frontend/app/components/Modal';
import { Video } from '@frontend/app/hooks/apis/videos/use-videos';

interface PlatformScheduleConfig {
  enabled: boolean;
  caption: string;
  hashtags: string;
  scheduledTime?: string;
}

interface ScheduleFormState {
  tiktok: PlatformScheduleConfig;
  youtube: PlatformScheduleConfig;
  instagram: PlatformScheduleConfig;
  facebook: PlatformScheduleConfig;
}

const getDefaultScheduleState = (): ScheduleFormState => ({
  tiktok: { enabled: false, caption: '', hashtags: '' },
  youtube: { enabled: false, caption: '', hashtags: '' },
  instagram: { enabled: false, caption: '', hashtags: '' },
  facebook: { enabled: false, caption: '', hashtags: '' },
});

const platformLabels: Record<keyof ScheduleFormState, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

interface ScheduleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
  onConfirm: (scheduleData: ScheduleFormState) => void;
  isScheduling?: boolean;
}

export default function ScheduleModal({
  isOpen,
  onOpenChange,
  video,
  onConfirm,
  isScheduling = false,
}: ScheduleModalProps) {
  const [formState, setFormState] = useState<ScheduleFormState>(
    getDefaultScheduleState(),
  );

  const handleToggle = (platform: keyof ScheduleFormState) => {
    setFormState((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        enabled: !prev[platform].enabled,
      },
    }));
  };

  const handleFieldChange = (
    platform: keyof ScheduleFormState,
    field: 'caption' | 'hashtags',
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const handleConfirm = () => {
    onConfirm(formState);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormState(getDefaultScheduleState());
    }
    onOpenChange(open);
  };

  const hasEnabledPlatform = Object.values(formState).some((p) => p.enabled);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={`Schedule: ${video?.title || 'Video'}`}
      onConfirm={handleConfirm}
      confirmLabel="Schedule"
      confirmDisabled={!hasEnabledPlatform}
      confirmLoading={isScheduling}
      maxWidth={550}
    >
      <Box>
        <Text as="p" size="2" color="gray" mb="4">
          Select platforms and customize content for each.
        </Text>

        <ScrollArea style={{ maxHeight: 400 }}>
          <Flex direction="column" gap="3" pr="3">
            {(Object.keys(formState) as Array<keyof ScheduleFormState>).map(
              (platform) => {
                const config = formState[platform];
                const label = platformLabels[platform];

                return (
                  <Box
                    key={platform}
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--gray-2)',
                      borderRadius: 'var(--radius-2)',
                    }}
                  >
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="2">
                        <Text size="2" weight="medium">
                          {label}
                        </Text>
                        <Text size="1" color="gray">
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </Text>
                      </Flex>
                      <Switch
                        size="1"
                        checked={config.enabled}
                        onCheckedChange={() => handleToggle(platform)}
                      />
                    </Flex>

                    {config.enabled && (
                      <Box mt="3">
                        <Separator size="4" mb="3" />

                        <Flex direction="column" gap="3">
                          <Box>
                            <Text as="label" size="1" weight="medium" color="gray">
                              Caption
                            </Text>
                            <TextArea
                              size="1"
                              placeholder={`Enter caption for ${label}...`}
                              value={config.caption}
                              onChange={(e) =>
                                handleFieldChange(platform, 'caption', e.target.value)
                              }
                              rows={3}
                              mt="1"
                            />
                          </Box>

                          <Box>
                            <Text as="label" size="1" weight="medium" color="gray">
                              Hashtags
                            </Text>
                            <TextField.Root
                              size="1"
                              placeholder="#trending #viral #fyp"
                              value={config.hashtags}
                              onChange={(e) =>
                                handleFieldChange(platform, 'hashtags', e.target.value)
                              }
                              mt="1"
                            />
                            <Text size="1" color="gray" mt="1">
                              Separate hashtags with spaces
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    )}
                  </Box>
                );
              },
            )}
          </Flex>
        </ScrollArea>
      </Box>
    </Modal>
  );
}

export type { ScheduleFormState, PlatformScheduleConfig };
