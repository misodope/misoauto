'use client';

import { Badge } from '@radix-ui/themes';
import type { PostStatus } from '@frontend/app/hooks/apis/videos/use-videos';

export interface PostStatusBadgeProps {
  status: PostStatus;
}

const STATUS_CONFIG: Record<
  PostStatus,
  { color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'; label: string }
> = {
  PENDING: { color: 'gray', label: 'Unscheduled' },
  SCHEDULED: { color: 'blue', label: 'Scheduled' },
  PUBLISHING: { color: 'yellow', label: 'Publishing' },
  PUBLISHED: { color: 'green', label: 'Published' },
  FAILED: { color: 'red', label: 'Failed' },
  CANCELLED: { color: 'yellow', label: 'Cancelled' },
};

export default function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge color={config.color} size="1">
      {config.label}
    </Badge>
  );
}
