'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Select,
  Button,
  Callout,
  RadioCards,
} from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Drawer from '@frontend/app/components/Drawer';
import { useToast } from '@frontend/app/components/Toaster';
import { useAuth, SocialAccount } from '@frontend/app/contexts/AuthContext';
import { Video } from '@frontend/app/hooks/apis/videos/use-videos';
import { useTikTokUploadDraft } from '@frontend/app/hooks/apis/integrations/use-integrations';

type UploadMode = 'draft' | 'direct';

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
}

export default function UploadDrawer({
  open,
  onOpenChange,
  video,
}: UploadDrawerProps) {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const uploadDraft = useTikTokUploadDraft();

  const connectedAccounts = useMemo(
    () => user?.socialAccounts || [],
    [user?.socialAccounts],
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<UploadMode>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = connectedAccounts.find(
    (a) => a.id === Number(selectedAccountId),
  );

  const handleSubmit = async () => {
    if (!video || !selectedAccount) return;

    setIsSubmitting(true);
    try {
      if (uploadMode === 'draft') {
        await uploadDraft.mutateAsync({ videoId: video.id });
        showSuccess(
          'Draft uploaded',
          `Video sent as draft to ${selectedAccount.platform.displayName || selectedAccount.platform.name}.`,
        );
        handleClose();
      }
      // 'direct' mode not yet supported
    } catch (err) {
      showError(
        'Upload failed',
        err instanceof Error ? err.message : 'Failed to upload video',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedAccountId('');
    setUploadMode('draft');
    onOpenChange(false);
  };

  const hasConnectedAccounts = connectedAccounts.length > 0;
  const canSubmit =
    !!selectedAccountId && uploadMode === 'draft' && !isSubmitting;

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(isOpen);
      }}
      title={`Upload: ${video?.title || 'Video'}`}
      description="Upload this video to a connected platform"
      width={420}
    >
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
        <Flex direction="column" gap="5">
          {/* Platform Selection */}
          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Platform
            </Text>
            <Select.Root
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <Select.Trigger
                placeholder="Select a platform..."
                style={{ width: '100%' }}
                mt="1"
              />
              <Select.Content>
                {connectedAccounts.map((account) => (
                  <Select.Item key={account.id} value={String(account.id)}>
                    {account.platform.displayName || account.platform.name} —
                    @{account.username}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Upload Mode */}
          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Upload Type
            </Text>
            <RadioCards.Root
              value={uploadMode}
              onValueChange={(val) => setUploadMode(val as UploadMode)}
              columns="2"
              mt="1"
            >
              <RadioCards.Item value="draft">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    Draft
                  </Text>
                  <Text size="1" color="gray">
                    Send to drafts for review
                  </Text>
                </Flex>
              </RadioCards.Item>
              <RadioCards.Item value="direct" disabled>
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    Direct
                  </Text>
                  <Text size="1" color="gray">
                    Coming soon
                  </Text>
                </Flex>
              </RadioCards.Item>
            </RadioCards.Root>
          </Box>

          {/* Submit */}
          <Button
            size="3"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
          >
            Upload Draft
          </Button>
        </Flex>
      )}
    </Drawer>
  );
}
