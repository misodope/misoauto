'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  TextField,
  Switch,
  Callout,
  ScrollArea,
} from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Modal from '@frontend/app/components/Modal';
import { useToast } from '@frontend/app/components/Toaster';
import { Video } from '@frontend/app/hooks/apis/videos/use-videos';
import { useCreateVideoPost } from '@frontend/app/hooks/apis/video-posts';
import { useAuth, SocialAccount } from '@frontend/app/contexts/AuthContext';

interface AccountScheduleConfig {
  enabled: boolean;
  socialAccountId: number;
  platformName: string;
  username: string;
}

interface ScheduleFormState {
  scheduledFor: string;
  accounts: Record<number, AccountScheduleConfig>;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
}

// Get minimum datetime (now + 10 minutes, rounded to nearest 5 min)
const getMinDateTime = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  // Round to nearest 5 minutes
  now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now.toISOString().slice(0, 16);
};

// Get default datetime (1 hour from now)
const getDefaultDateTime = (): string => {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.toISOString().slice(0, 16);
};

const buildInitialState = (
  socialAccounts: SocialAccount[] = [],
): ScheduleFormState => {
  const accounts: Record<number, AccountScheduleConfig> = {};

  socialAccounts.forEach((account) => {
    accounts[account.id] = {
      enabled: false,
      socialAccountId: account.id,
      platformName: account.platform.displayName || account.platform.name,
      username: account.username,
    };
  });

  return {
    scheduledFor: getDefaultDateTime(),
    accounts,
  };
};

export default function ScheduleModal({
  isOpen,
  onOpenChange,
  video,
}: ScheduleModalProps) {
  const { user } = useAuth();
  const { success: showSuccess } = useToast();
  const createVideoPost = useCreateVideoPost();

  const connectedAccounts = useMemo(
    () => user?.socialAccounts || [],
    [user?.socialAccounts],
  );

  const [formState, setFormState] = useState<ScheduleFormState>(() =>
    buildInitialState(connectedAccounts),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (accountId: number) => {
    setFormState((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [accountId]: {
          ...prev.accounts[accountId],
          enabled: !prev.accounts[accountId].enabled,
        },
      },
    }));
  };

  const handleDateChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      scheduledFor: value,
    }));
  };

  const handleConfirm = async () => {
    if (!video) return;

    const enabledAccounts = Object.values(formState.accounts).filter(
      (a) => a.enabled,
    );

    if (enabledAccounts.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create video posts for each enabled account
      const scheduledFor = new Date(formState.scheduledFor).toISOString();

      await Promise.all(
        enabledAccounts.map((account) =>
          createVideoPost.mutateAsync({
            videoId: video.id,
            socialAccountId: account.socialAccountId,
            scheduledFor,
          }),
        ),
      );

      // Reset and close on success
      setFormState(buildInitialState(connectedAccounts));
      onOpenChange(false);
      showSuccess(
        'Video scheduled',
        'Your video has been scheduled for posting.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule video');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setFormState(buildInitialState(connectedAccounts));
      setError(null);
    }
    onOpenChange(open);
  };

  const enabledCount = Object.values(formState.accounts).filter(
    (a) => a.enabled,
  ).length;
  const hasEnabledAccount = enabledCount > 0;
  const hasConnectedAccounts = connectedAccounts.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={`Schedule: ${video?.title || 'Video'}`}
      onConfirm={handleConfirm}
      confirmLabel={
        enabledCount > 0 ? `Schedule (${enabledCount})` : 'Schedule'
      }
      confirmDisabled={!hasEnabledAccount || !formState.scheduledFor}
      confirmLoading={isSubmitting}
      maxWidth={500}
    >
      <Box>
        {error && (
          <Callout.Root color="red" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {!hasConnectedAccounts ? (
          <Callout.Root color="yellow">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              No connected accounts. Go to Integrations to connect your social
              media accounts.
            </Callout.Text>
          </Callout.Root>
        ) : (
          <>
            {/* Schedule Date/Time */}
            <Box mb="4">
              <Text as="label" size="2" weight="medium" mb="2">
                Schedule Date & Time *
              </Text>
              <TextField.Root
                type="datetime-local"
                value={formState.scheduledFor}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getMinDateTime()}
                mt="1"
              />
              <Text size="1" color="gray" mt="1">
                Must be at least 10 minutes in the future
              </Text>
            </Box>

            {/* Platform Selection */}
            <Box>
              <Text size="2" weight="medium" mb="2">
                Select Accounts
              </Text>
              <ScrollArea style={{ maxHeight: 300 }}>
                <Flex direction="column" gap="2" pr="3">
                  {connectedAccounts.map((account) => {
                    const config = formState.accounts[account.id];
                    if (!config) return null;

                    return (
                      <Box
                        key={account.id}
                        style={{
                          padding: 'var(--space-3)',
                          backgroundColor: config.enabled
                            ? 'var(--accent-3)'
                            : 'var(--gray-2)',
                          borderRadius: 'var(--radius-2)',
                          border: config.enabled
                            ? '1px solid var(--accent-7)'
                            : '1px solid transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Flex justify="between" align="center">
                          <Flex direction="column" gap="1">
                            <Text size="2" weight="medium">
                              {config.platformName}
                            </Text>
                            <Text size="1" color="gray">
                              @{config.username}
                            </Text>
                          </Flex>
                          <Switch
                            size="1"
                            checked={config.enabled}
                            onCheckedChange={() => handleToggle(account.id)}
                          />
                        </Flex>
                      </Box>
                    );
                  })}
                </Flex>
              </ScrollArea>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
}

// Legacy exports for backward compatibility
export interface PlatformScheduleConfig {
  enabled: boolean;
  caption: string;
  hashtags: string;
  scheduledTime?: string;
}

export interface LegacyScheduleFormState {
  tiktok: PlatformScheduleConfig;
  youtube: PlatformScheduleConfig;
  instagram: PlatformScheduleConfig;
  facebook: PlatformScheduleConfig;
}

export type { ScheduleFormState };
