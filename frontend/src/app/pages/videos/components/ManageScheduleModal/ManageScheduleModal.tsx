'use client';

import { useMemo } from 'react';
import { Card, Flex, Text } from '@radix-ui/themes';
import Modal from '@frontend/app/components/Modal';
import {
  Video,
  VideoPostSummary,
} from '@frontend/app/hooks/apis/videos/use-videos';
import { formatScheduledDate } from '@frontend/app/lib/dates';
import PostStatusBadge from '../PostStatusBadge';
import ScheduledPostActions from '../ScheduledPostActions';

export interface ManageScheduleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
}

type ManageablePost = VideoPostSummary & { status: 'SCHEDULED' | 'PENDING' };

const isManageable = (post: VideoPostSummary): post is ManageablePost =>
  post.status === 'SCHEDULED' || post.status === 'PENDING';

/** Scheduled posts first (soonest first), then unscheduled ones. */
const compareManageablePosts = (a: ManageablePost, b: ManageablePost) => {
  if (a.status !== b.status) return a.status === 'SCHEDULED' ? -1 : 1;
  const aTime = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
  const bTime = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
  return aTime - bTime;
};

export default function ManageScheduleModal({
  isOpen,
  onOpenChange,
  video,
}: ManageScheduleModalProps) {
  const posts = useMemo(
    () =>
      (video?.posts ?? []).filter(isManageable).sort(compareManageablePosts),
    [video?.posts],
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Manage schedule: ${video?.title || 'Video'}`}
      showFooter={false}
      maxWidth={520}
    >
      {posts.length === 0 ? (
        <Text as="p" size="2" color="gray">
          No scheduled posts for this video.
        </Text>
      ) : (
        <Flex direction="column" gap="3">
          {posts.map((post) => (
            <Card key={post.id}>
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      {post.platform.displayName ?? post.platform.name}
                    </Text>
                    {post.scheduledFor && (
                      <Text size="1" color="gray">
                        {formatScheduledDate(post.scheduledFor)}
                      </Text>
                    )}
                  </Flex>
                  <PostStatusBadge status={post.status} />
                </Flex>
                <ScheduledPostActions
                  videoPostId={post.id}
                  status={post.status}
                  scheduledFor={post.scheduledFor}
                  onDone={() => onOpenChange(false)}
                />
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Modal>
  );
}
