'use client';

import { useState } from 'react';
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import Modal from '@frontend/app/components/Modal';
import { useToast } from '@frontend/app/components/Toaster';
import {
  PostStatus,
  useCancelSchedule,
  useDeleteVideoPost,
  useScheduleVideoPost,
} from '@frontend/app/hooks/apis/video-posts';
import {
  getDefaultScheduleDateTime,
  getMinScheduleDateTime,
  toDateTimeLocalValue,
} from '@frontend/app/lib/dates';
import { getErrorMessage } from '@frontend/app/lib/errors';

export interface ScheduledPostActionsProps {
  videoPostId: number;
  status: Extract<PostStatus, 'SCHEDULED' | 'PENDING'>;
  scheduledFor?: string | null;
  /** Called after a successful action so the parent can close itself. */
  onDone: () => void;
}

export default function ScheduledPostActions({
  videoPostId,
  status,
  scheduledFor,
  onDone,
}: ScheduledPostActionsProps) {
  const { success: showSuccess, error: showError } = useToast();
  const scheduleVideoPost = useScheduleVideoPost();
  const cancelSchedule = useCancelSchedule();
  const deleteVideoPost = useDeleteVideoPost();

  const [dateValue, setDateValue] = useState(() =>
    scheduledFor
      ? toDateTimeLocalValue(new Date(scheduledFor))
      : getDefaultScheduleDateTime(),
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isScheduled = status === 'SCHEDULED';
  const isPending =
    scheduleVideoPost.isPending ||
    cancelSchedule.isPending ||
    deleteVideoPost.isPending;

  const handleSchedule = async () => {
    try {
      await scheduleVideoPost.mutateAsync({
        id: videoPostId,
        scheduledFor: new Date(dateValue).toISOString(),
      });
      showSuccess(isScheduled ? 'Post rescheduled' : 'Post scheduled');
      onDone();
    } catch (error) {
      showError(
        isScheduled ? 'Reschedule failed' : 'Schedule failed',
        getErrorMessage(error, 'Failed to schedule post'),
      );
    }
  };

  const handleUnschedule = async () => {
    try {
      await cancelSchedule.mutateAsync(videoPostId);
      showSuccess(
        'Post unscheduled',
        'It stays on the video so you can schedule it again.',
      );
      onDone();
    } catch (error) {
      showError(
        'Unschedule failed',
        getErrorMessage(error, 'Failed to unschedule post'),
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVideoPost.mutateAsync(videoPostId);
      setDeleteConfirmOpen(false);
      showSuccess('Post deleted');
      onDone();
    } catch (error) {
      showError(
        'Delete failed',
        getErrorMessage(error, 'Failed to delete post'),
      );
    }
  };

  return (
    <Flex direction="column" gap="3">
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="medium">
          {isScheduled ? 'Reschedule for' : 'Schedule for'}
        </Text>
        <Flex gap="2" align="center">
          <Box flexGrow="1">
            <TextField.Root
              type="datetime-local"
              value={dateValue}
              min={getMinScheduleDateTime()}
              onChange={(event) => setDateValue(event.target.value)}
              disabled={isPending}
            />
          </Box>
          <Button
            onClick={handleSchedule}
            disabled={isPending || !dateValue}
            loading={scheduleVideoPost.isPending}
          >
            {isScheduled ? 'Reschedule' : 'Schedule'}
          </Button>
        </Flex>
      </Flex>

      <Flex gap="2">
        {isScheduled && (
          <Button
            variant="soft"
            onClick={handleUnschedule}
            disabled={isPending}
            loading={cancelSchedule.isPending}
          >
            Unschedule
          </Button>
        )}
        <Button
          variant="soft"
          color="red"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={isPending}
        >
          Delete
        </Button>
      </Flex>

      <Modal
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete scheduled post"
        onConfirm={handleDelete}
        confirmLabel="Delete"
        confirmColor="red"
        confirmLoading={deleteVideoPost.isPending}
      >
        <Text as="p" size="2">
          Delete this post? The video stays in your library.
        </Text>
      </Modal>
    </Flex>
  );
}
