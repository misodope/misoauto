'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Callout,
  Flex,
  RadioCards,
  Select,
  Separator,
  Switch,
  Text,
  TextArea,
  Button,
} from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Drawer from '@frontend/app/components/Drawer';
import { useToast } from '@frontend/app/components/Toaster';
import { useAuth } from '@frontend/app/contexts/AuthContext';
import { Video } from '@frontend/app/hooks/apis/videos/use-videos';
import {
  useInstagramPublish,
  useInstagramPublishStatus,
  useInstagramUploadDraft,
  useTikTokUploadDraft,
  useYouTubeUploadDraft,
} from '@frontend/app/hooks/apis/integrations/use-integrations';

type UploadMode = 'draft' | 'direct';
type WorkflowState =
  | 'idle'
  | 'preparing'
  | 'processing'
  | 'ready'
  | 'publishing'
  | 'published'
  | 'error';

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1_000;

interface PublishVideoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
};

export default function PublishVideoDrawer({
  open,
  onOpenChange,
  video,
}: PublishVideoDrawerProps) {
  const { user } = useAuth();
  const {
    toast: showToast,
    success: showSuccess,
    error: showError,
  } = useToast();
  const tiktokUploadDraft = useTikTokUploadDraft();
  const youtubeUploadDraft = useYouTubeUploadDraft();
  const instagramUploadDraft = useInstagramUploadDraft();
  const instagramPublishStatus = useInstagramPublishStatus();
  const instagramPublish = useInstagramPublish();

  const connectedAccounts = useMemo(
    () => user?.socialAccounts || [],
    [user?.socialAccounts],
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<UploadMode>('draft');
  const [caption, setCaption] = useState('');
  const [shareToFeed, setShareToFeed] = useState(true);
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
  const [containerId, setContainerId] = useState<string | null>(null);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operationRef = useRef(0);

  const selectedAccount = connectedAccounts.find(
    (account) => account.id === Number(selectedAccountId),
  );
  const isInstagram =
    selectedAccount?.platform.name.toUpperCase() === 'INSTAGRAM';

  useEffect(() => {
    if (open) {
      setCaption(video?.description ?? '');
      setShareToFeed(true);
    }
  }, [open, video]);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const clearPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  const resetWorkflow = () => {
    operationRef.current += 1;
    clearPolling();
    setWorkflowState('idle');
    setContainerId(null);
    setWorkflowMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = (force = false) => {
    const isInProgress =
      workflowState === 'preparing' ||
      workflowState === 'processing' ||
      workflowState === 'publishing';

    if (!force && isInProgress) {
      const confirmed = window.confirm(
        'This Instagram upload is still processing. Closing will discard it. Continue?',
      );
      if (!confirmed) return;
    }

    resetWorkflow();
    setSelectedAccountId('');
    setUploadMode('draft');
    setCaption('');
    setShareToFeed(true);
    onOpenChange(false);
  };

  const publishInstagramContainer = async (
    nextContainerId: string,
    operationId: number,
  ) => {
    if (operationId !== operationRef.current) return;

    setWorkflowState('publishing');
    setWorkflowMessage(null);
    setIsSubmitting(true);

    try {
      const result = await instagramPublish.mutateAsync({
        containerId: nextContainerId,
      });

      if (operationId !== operationRef.current) return;

      setWorkflowState('published');
      showToast({
        title: 'Instagram Reel published',
        description: 'Your Reel is live on Instagram.',
        variant: 'success',
        action: { label: 'Open on Instagram', href: result.permalink },
      });
      handleClose(true);
    } catch (error) {
      if (operationId !== operationRef.current) return;
      const message = getErrorMessage(
        error,
        'Failed to publish Instagram Reel',
      );
      setWorkflowState('error');
      setWorkflowMessage(message);
      showError('Publish failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollInstagramStatus = async (
    nextContainerId: string,
    mode: UploadMode,
    operationId: number,
    startedAt: number,
  ): Promise<void> => {
    if (operationId !== operationRef.current) return;

    if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      setWorkflowState('error');
      setWorkflowMessage('Instagram processing timed out after 10 minutes.');
      return;
    }

    try {
      const result = await instagramPublishStatus.mutateAsync({
        containerId: nextContainerId,
      });

      if (operationId !== operationRef.current) return;

      if (result.statusCode === 'FINISHED') {
        if (mode === 'direct') {
          await publishInstagramContainer(nextContainerId, operationId);
        } else {
          setWorkflowState('ready');
          setWorkflowMessage('Ready to publish. Closing discards this Reel.');
        }
        return;
      }

      if (result.statusCode === 'ERROR' || result.statusCode === 'EXPIRED') {
        const message =
          result.status || `Instagram upload status: ${result.statusCode}`;
        setWorkflowState('error');
        setWorkflowMessage(message);
        return;
      }

      setWorkflowMessage(result.status || 'Instagram is processing the Reel.');
      pollTimeoutRef.current = setTimeout(() => {
        void pollInstagramStatus(nextContainerId, mode, operationId, startedAt);
      }, POLL_INTERVAL_MS);
    } catch (error) {
      if (operationId !== operationRef.current) return;
      const message = getErrorMessage(
        error,
        'Failed to fetch Instagram upload status',
      );
      setWorkflowState('error');
      setWorkflowMessage(message);
    }
  };

  const handleSubmit = async () => {
    if (!video || !selectedAccount) return;

    const platformName = selectedAccount.platform.name.toUpperCase();
    setIsSubmitting(true);

    try {
      if (platformName === 'INSTAGRAM') {
        if (workflowState === 'ready' && containerId) {
          await publishInstagramContainer(containerId, operationRef.current);
          return;
        }

        const operationId = operationRef.current + 1;
        operationRef.current = operationId;
        setWorkflowState('preparing');
        setWorkflowMessage(null);

        const result = await instagramUploadDraft.mutateAsync({
          videoId: video.id,
          caption,
          shareToFeed,
        });

        if (operationId !== operationRef.current) return;

        setContainerId(result.containerId);
        setWorkflowState('processing');
        setWorkflowMessage('Instagram is processing the Reel.');
        void pollInstagramStatus(
          result.containerId,
          uploadMode,
          operationId,
          Date.now(),
        );
        return;
      }

      if (uploadMode !== 'draft') return;

      if (platformName === 'TIKTOK') {
        await tiktokUploadDraft.mutateAsync({ videoId: video.id });
      } else if (platformName === 'YOUTUBE') {
        await youtubeUploadDraft.mutateAsync({ videoId: video.id });
      } else {
        throw new Error('This platform is not supported for uploads.');
      }

      showSuccess(
        'Draft uploaded',
        `Video sent as draft to ${selectedAccount.platform.displayName || selectedAccount.platform.name}.`,
      );
      handleClose(true);
    } catch (error) {
      if (platformName === 'INSTAGRAM') {
        const message = getErrorMessage(
          error,
          'Failed to prepare Instagram Reel',
        );
        setWorkflowState('error');
        setWorkflowMessage(message);
      }
      showError(
        'Upload failed',
        getErrorMessage(error, 'Failed to upload video'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountChange = (accountId: string) => {
    resetWorkflow();
    setSelectedAccountId(accountId);
    setUploadMode('draft');
  };

  const hasConnectedAccounts = connectedAccounts.length > 0;
  const canSubmit =
    !!selectedAccount &&
    !isSubmitting &&
    (isInstagram
      ? workflowState === 'idle' ||
        (workflowState === 'ready' && uploadMode === 'draft')
      : uploadMode === 'draft' && workflowState === 'idle');

  const submitLabel = isInstagram
    ? workflowState === 'ready'
      ? 'Publish now'
      : uploadMode === 'direct'
        ? 'Upload and post as a Reel'
        : 'Prepare Reel'
    : 'Upload Draft';

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
          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Platform
            </Text>
            <Select.Root
              value={selectedAccountId}
              onValueChange={handleAccountChange}
            >
              <Select.Trigger
                placeholder="Select a platform..."
                style={{ width: '100%' }}
                mt="1"
              />
              <Select.Content>
                {connectedAccounts.map((account) => (
                  <Select.Item key={account.id} value={String(account.id)}>
                    {account.platform.displayName || account.platform.name} — @
                    {account.username}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Upload Type
            </Text>
            <RadioCards.Root
              value={uploadMode}
              onValueChange={(value) => setUploadMode(value as UploadMode)}
              columns="2"
              mt="1"
            >
              <RadioCards.Item value="draft">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    {isInstagram ? 'Prepare' : 'Draft'}
                  </Text>
                  <Text size="1" color="gray">
                    {isInstagram
                      ? 'Upload and process on Instagram without posting. Publish within 24h.'
                      : 'Send to drafts for review'}
                  </Text>
                </Flex>
              </RadioCards.Item>
              <RadioCards.Item value="direct" disabled={!isInstagram}>
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    Direct
                  </Text>
                  <Text size="1" color="gray">
                    {isInstagram ? 'Upload and post as a Reel' : 'Coming soon'}
                  </Text>
                </Flex>
              </RadioCards.Item>
            </RadioCards.Root>
          </Box>

          {isInstagram && (
            <Box>
              <Flex justify="between" align="center">
                <Text as="label" size="2" weight="medium">
                  Caption
                </Text>
                <Text size="1" color="gray">
                  {caption.length}/2200
                </Text>
              </Flex>
              <TextArea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={2200}
                rows={4}
                mt="1"
                placeholder="Write a caption for your Reel..."
              />
              <Separator size="4" my="3" />
              <Flex justify="between" align="center">
                <Text size="2">Also share to feed</Text>
                <Switch
                  checked={shareToFeed}
                  onCheckedChange={setShareToFeed}
                />
              </Flex>
            </Box>
          )}

          {workflowMessage && workflowState !== 'error' && (
            <Callout.Root color={workflowState === 'ready' ? 'green' : 'blue'}>
              <Callout.Text>{workflowMessage}</Callout.Text>
            </Callout.Root>
          )}

          {workflowState === 'error' && workflowMessage && (
            <Callout.Root color="red">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>{workflowMessage}</Callout.Text>
            </Callout.Root>
          )}

          <Button
            size="3"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
          >
            {submitLabel}
          </Button>
        </Flex>
      )}
    </Drawer>
  );
}
