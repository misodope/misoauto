'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Callout,
  Flex,
  Select,
  Text,
  Tooltip,
} from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Drawer from '@frontend/app/components/Drawer';
import ProgressOverlay from '@frontend/app/components/ProgressOverlay';
import { useToast } from '@frontend/app/components/Toaster';
import { useAuth } from '@frontend/app/contexts/AuthContext';
import { Video } from '@frontend/app/hooks/apis/videos/use-videos';
import { getErrorMessage } from '@frontend/app/lib/errors';
import {
  YouTubePublishPrivacyStatus,
  useInstagramPublish,
  useInstagramPublishStatus,
  useInstagramUploadDraft,
  useTikTokPublishStatus,
  useTikTokUploadDraft,
  useYouTubePublish,
  useYouTubePublishStatus,
  useYouTubeUploadDraft,
} from '@frontend/app/hooks/apis/integrations/use-integrations';
import UploadModeSelector, {
  UploadMode,
} from './components/UploadModeSelector';
import InstagramReelFields from './components/InstagramReelFields';
import YouTubeVideoFields, {
  YOUTUBE_TITLE_MAX,
  isYouTubeMetadataValid,
} from './components/YouTubeVideoFields';
import WorkflowStatusCallout, {
  WorkflowState,
} from './components/WorkflowStatusCallout';
import {
  instagramStatusMessage,
  tiktokStatusMessage,
  youtubeStatusMessage,
} from './statusText';

type WorkflowPlatform = 'instagram' | 'youtube' | 'tiktok';
type PollResult =
  | { state: 'finished' }
  | { state: 'failed'; message: string }
  | { state: 'pending'; message: string };

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS: Record<WorkflowPlatform, number> = {
  instagram: 10 * 60 * 1_000,
  youtube: 30 * 60 * 1_000,
  tiktok: 10 * 60 * 1_000,
};

const PLATFORM_LABEL: Record<WorkflowPlatform, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

// Platforms with a separate publish step after processing. TikTok inbox
// uploads are finished by the user in the TikTok app instead.
const SUPPORTS_PUBLISH: Record<WorkflowPlatform, boolean> = {
  instagram: true,
  youtube: true,
  tiktok: false,
};

interface PublishVideoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
}

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
  const tiktokPublishStatus = useTikTokPublishStatus();
  const youtubeUploadDraft = useYouTubeUploadDraft();
  const youtubePublishStatus = useYouTubePublishStatus();
  const youtubePublish = useYouTubePublish();
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [madeForKids, setMadeForKids] = useState(false);
  const [privacyStatus, setPrivacyStatus] =
    useState<YouTubePublishPrivacyStatus>('public');
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle');
  const [platformMediaId, setPlatformMediaId] = useState<string | null>(null);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operationRef = useRef(0);

  // Accounts this video is already live on; republishing would create a duplicate post.
  const publishedAccountIds = useMemo(
    () =>
      new Set(
        (video?.posts ?? [])
          .filter((post) => post.status === 'PUBLISHED')
          .map((post) => post.socialAccountId),
      ),
    [video?.posts],
  );

  const selectedAccount = connectedAccounts.find(
    (account) => account.id === Number(selectedAccountId),
  );
  const selectedPlatformName = selectedAccount?.platform.name.toUpperCase();
  const isInstagram = selectedPlatformName === 'INSTAGRAM';
  const isYouTube = selectedPlatformName === 'YOUTUBE';
  const isTikTok = selectedPlatformName === 'TIKTOK';
  const workflowPlatform: WorkflowPlatform | null = isInstagram
    ? 'instagram'
    : isYouTube
      ? 'youtube'
      : isTikTok
        ? 'tiktok'
        : null;

  // Long-running work (upload, platform processing, publish) is underway; the
  // drawer is locked behind a progress overlay until it finishes or fails.
  const isBusy =
    isSubmitting ||
    workflowState === 'preparing' ||
    workflowState === 'processing' ||
    workflowState === 'publishing';

  const platformLabel = workflowPlatform
    ? PLATFORM_LABEL[workflowPlatform]
    : selectedAccount?.platform.displayName || 'the platform';

  // The status message carries the platform-specific detail, so the
  // processing title stays generic to avoid repeating it.
  const overlayTitle =
    workflowState === 'processing'
      ? `Waiting for ${platformLabel}…`
      : workflowState === 'publishing'
        ? `Publishing to ${platformLabel}…`
        : `Sending your video to ${platformLabel}…`;

  useEffect(() => {
    if (!isBusy) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isBusy]);

  useEffect(() => {
    if (open) {
      setCaption(video?.description ?? '');
      setShareToFeed(true);
      setTitle((video?.title ?? '').slice(0, YOUTUBE_TITLE_MAX));
      setDescription(video?.description ?? '');
      setMadeForKids(false);
      setPrivacyStatus('public');
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
    setPlatformMediaId(null);
    setWorkflowMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = (force = false) => {
    if (!force && isBusy) return;

    resetWorkflow();
    setSelectedAccountId('');
    setUploadMode('draft');
    setCaption('');
    setShareToFeed(true);
    setTitle('');
    setDescription('');
    setMadeForKids(false);
    setPrivacyStatus('public');
    onOpenChange(false);
  };

  const publishMedia = async (
    platform: WorkflowPlatform,
    mediaId: string,
    operationId: number,
  ) => {
    if (operationId !== operationRef.current) return;

    setWorkflowState('publishing');
    setWorkflowMessage(null);
    setIsSubmitting(true);

    try {
      if (platform === 'instagram') {
        const result = await instagramPublish.mutateAsync({
          containerId: mediaId,
        });
        if (operationId !== operationRef.current) return;

        setWorkflowState('published');
        showToast({
          title: 'Instagram Reel published',
          description: 'Your Reel is live on Instagram.',
          variant: 'success',
          action: { label: 'Open on Instagram', href: result.permalink },
        });
      } else {
        const result = await youtubePublish.mutateAsync({
          videoId: mediaId,
          privacyStatus,
        });
        if (operationId !== operationRef.current) return;

        setWorkflowState('published');
        showToast({
          title: 'YouTube video published',
          description:
            result.privacyStatus === 'unlisted'
              ? 'Your video is live on YouTube as unlisted.'
              : 'Your video is live on YouTube.',
          variant: 'success',
          action: { label: 'Open on YouTube', href: result.url },
        });
      }
      handleClose(true);
    } catch (error) {
      if (operationId !== operationRef.current) return;
      const message = getErrorMessage(
        error,
        `Failed to publish to ${PLATFORM_LABEL[platform]}`,
      );
      setWorkflowState('error');
      setWorkflowMessage(message);
      showError('Publish failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchProcessingStatus = async (
    platform: WorkflowPlatform,
    mediaId: string,
  ): Promise<PollResult> => {
    if (platform === 'instagram') {
      const result = await instagramPublishStatus.mutateAsync({
        containerId: mediaId,
      });
      if (result.statusCode === 'FINISHED') return { state: 'finished' };
      const message = instagramStatusMessage(result.statusCode, result.status);
      if (
        result.statusCode === 'ERROR' ||
        result.statusCode === 'EXPIRED' ||
        result.statusCode === 'PUBLISHED'
      ) {
        return { state: 'failed', message };
      }
      return { state: 'pending', message };
    }

    if (platform === 'tiktok') {
      const result = await tiktokPublishStatus.mutateAsync({
        publishId: mediaId,
      });
      if (
        result.status === 'SEND_TO_USER_INBOX' ||
        result.status === 'PUBLISH_COMPLETE'
      ) {
        return { state: 'finished' };
      }
      const message = tiktokStatusMessage(result.status, result.fail_reason);
      if (result.status === 'FAILED') return { state: 'failed', message };
      return { state: 'pending', message };
    }

    const result = await youtubePublishStatus.mutateAsync({ videoId: mediaId });
    if (result.processingStatus === 'succeeded') return { state: 'finished' };
    if (
      result.processingStatus === 'failed' ||
      result.processingStatus === 'terminated'
    ) {
      return {
        state: 'failed',
        message: youtubeStatusMessage(
          result.processingStatus,
          result.failureReason,
        ),
      };
    }
    return {
      state: 'pending',
      message: youtubeStatusMessage(result.processingStatus),
    };
  };

  const pollProcessingStatus = async (
    platform: WorkflowPlatform,
    mediaId: string,
    mode: UploadMode,
    operationId: number,
    startedAt: number,
  ): Promise<void> => {
    if (operationId !== operationRef.current) return;

    if (Date.now() - startedAt >= POLL_TIMEOUT_MS[platform]) {
      const minutes = POLL_TIMEOUT_MS[platform] / 60_000;
      setWorkflowState('error');
      setWorkflowMessage(
        `${PLATFORM_LABEL[platform]} processing timed out after ${minutes} minutes.`,
      );
      return;
    }

    try {
      const result = await fetchProcessingStatus(platform, mediaId);
      if (operationId !== operationRef.current) return;

      if (result.state === 'finished') {
        if (!SUPPORTS_PUBLISH[platform]) {
          setWorkflowState('published');
          showSuccess(
            `Sent to ${PLATFORM_LABEL[platform]}`,
            tiktokStatusMessage('SEND_TO_USER_INBOX'),
          );
          handleClose(true);
        } else if (mode === 'direct') {
          await publishMedia(platform, mediaId, operationId);
        } else {
          setWorkflowState('ready');
          setWorkflowMessage(
            platform === 'youtube'
              ? 'Ready to publish. Closing keeps it as a private video on YouTube.'
              : 'Ready to publish. Closing discards this Reel.',
          );
        }
        return;
      }

      if (result.state === 'failed') {
        setWorkflowState('error');
        setWorkflowMessage(result.message);
        return;
      }

      setWorkflowMessage(result.message);
      pollTimeoutRef.current = setTimeout(() => {
        void pollProcessingStatus(
          platform,
          mediaId,
          mode,
          operationId,
          startedAt,
        );
      }, POLL_INTERVAL_MS);
    } catch (error) {
      if (operationId !== operationRef.current) return;
      const message = getErrorMessage(
        error,
        `Failed to fetch ${PLATFORM_LABEL[platform]} upload status`,
      );
      setWorkflowState('error');
      setWorkflowMessage(message);
    }
  };

  const startPlatformUpload = async (platform: WorkflowPlatform) => {
    if (!video) return;

    if (workflowState === 'ready' && platformMediaId) {
      await publishMedia(platform, platformMediaId, operationRef.current);
      return;
    }

    const operationId = operationRef.current + 1;
    operationRef.current = operationId;
    setWorkflowState('preparing');
    setWorkflowMessage(
      platform === 'youtube'
        ? 'Uploading to YouTube. This can take a few minutes for large videos.'
        : null,
    );

    let mediaId: string;
    if (platform === 'instagram') {
      const result = await instagramUploadDraft.mutateAsync({
        videoId: video.id,
        caption,
        shareToFeed,
      });
      mediaId = result.containerId;
    } else if (platform === 'tiktok') {
      const result = await tiktokUploadDraft.mutateAsync({ videoId: video.id });
      mediaId = result.publish_id;
    } else {
      const result = await youtubeUploadDraft.mutateAsync({
        videoId: video.id,
        title: title.trim(),
        description,
        madeForKids,
      });
      mediaId = result.videoId;
    }

    if (operationId !== operationRef.current) return;

    setPlatformMediaId(mediaId);
    setWorkflowState('processing');
    setWorkflowMessage(
      platform === 'youtube'
        ? youtubeStatusMessage('processing')
        : platform === 'tiktok'
          ? tiktokStatusMessage('PROCESSING_UPLOAD')
          : instagramStatusMessage('IN_PROGRESS'),
    );
    void pollProcessingStatus(
      platform,
      mediaId,
      uploadMode,
      operationId,
      Date.now(),
    );
  };

  const handleSubmit = async () => {
    if (!video || !selectedAccount) return;

    setIsSubmitting(true);

    try {
      if (!workflowPlatform) {
        throw new Error('This platform is not supported for uploads.');
      }
      await startPlatformUpload(workflowPlatform);
    } catch (error) {
      if (workflowPlatform) {
        const message = getErrorMessage(
          error,
          `Failed to upload to ${PLATFORM_LABEL[workflowPlatform]}`,
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

  const youtubeTitleInvalid =
    isYouTube && !isYouTubeMetadataValid(title, description);

  const hasConnectedAccounts = connectedAccounts.length > 0;
  const canSubmit =
    !!selectedAccount &&
    !publishedAccountIds.has(selectedAccount.id) &&
    !!workflowPlatform &&
    !isSubmitting &&
    !youtubeTitleInvalid &&
    (SUPPORTS_PUBLISH[workflowPlatform] || uploadMode === 'draft') &&
    (workflowState === 'idle' ||
      (workflowState === 'ready' && uploadMode === 'draft'));

  const submitLabel = (() => {
    if (workflowState === 'ready') return 'Publish now';
    if (isInstagram) {
      return uploadMode === 'direct'
        ? 'Upload and post as a Reel'
        : 'Prepare Reel';
    }
    if (isYouTube) {
      return uploadMode === 'direct'
        ? 'Upload and publish'
        : 'Upload as private draft';
    }
    if (isTikTok) return 'Send to TikTok inbox';
    return 'Upload Draft';
  })();

  const draftDescription = isInstagram
    ? 'Upload and process on Instagram without posting. Publish within 24h.'
    : isYouTube
      ? 'Upload as a private video. Publish now or later from YouTube Studio.'
      : isTikTok
        ? 'Send to your TikTok inbox, then finish posting in the TikTok app.'
        : 'Send to drafts for review';
  const directDescription = isInstagram
    ? 'Upload and post as a Reel'
    : isYouTube
      ? 'Upload and publish once YouTube finishes processing'
      : 'Coming soon';

  const isWorkflowLocked =
    workflowState !== 'idle' && workflowState !== 'error';

  return (
    <Drawer
      preventClose={isBusy}
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
                {connectedAccounts.map((account) => {
                  const platformName =
                    account.platform.displayName || account.platform.name;
                  const isPublished = publishedAccountIds.has(account.id);
                  const item = (
                    <Select.Item
                      key={account.id}
                      value={String(account.id)}
                      disabled={isPublished}
                    >
                      {platformName} — @{account.username}
                      {isPublished && ' · Published'}
                    </Select.Item>
                  );

                  return isPublished ? (
                    <Tooltip
                      key={account.id}
                      content={`This video has already been published on ${platformName}.`}
                    >
                      {item}
                    </Tooltip>
                  ) : (
                    item
                  );
                })}
              </Select.Content>
            </Select.Root>
          </Box>

          <UploadModeSelector
            value={uploadMode}
            onChange={setUploadMode}
            draftLabel={isInstagram ? 'Prepare' : 'Draft'}
            draftDescription={draftDescription}
            directDescription={directDescription}
            directDisabled={
              !workflowPlatform || !SUPPORTS_PUBLISH[workflowPlatform]
            }
          />

          {isInstagram && (
            <InstagramReelFields
              caption={caption}
              shareToFeed={shareToFeed}
              onCaptionChange={setCaption}
              onShareToFeedChange={setShareToFeed}
            />
          )}

          {isYouTube && (
            <YouTubeVideoFields
              title={title}
              description={description}
              privacyStatus={privacyStatus}
              madeForKids={madeForKids}
              metadataLocked={isWorkflowLocked}
              privacyLocked={workflowState === 'publishing'}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onPrivacyStatusChange={setPrivacyStatus}
              onMadeForKidsChange={setMadeForKids}
            />
          )}

          <WorkflowStatusCallout
            state={workflowState}
            message={workflowMessage}
          />

          <ProgressOverlay
            open={isBusy}
            title={overlayTitle}
            message={workflowMessage}
          />

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
