import React, { useEffect, useState } from 'react';
import { Badge, Text } from '@radix-ui/themes';
import { CalendarIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

import { DataTable } from '@frontend/app/components/DataTable';
import ActionMenu from '@frontend/app/components/ActionMenu';
import {
  useVideos,
  useDeleteVideo,
  Video,
  VideoPostSummary,
  PlatformType,
  PostStatus,
} from '@frontend/app/hooks/apis/videos/use-videos';
import { useUploads } from '@frontend/app/contexts/UploadContext/uploadContext';
import DeleteModal from '../DeleteModal';
import ScheduleModal from '../ScheduleModal';

const PLATFORMS: { type: PlatformType; label: string }[] = [
  { type: 'TIKTOK', label: 'TikTok' },
  { type: 'YOUTUBE', label: 'YouTube' },
  { type: 'INSTAGRAM', label: 'Instagram' },
  { type: 'FACEBOOK', label: 'Facebook' },
];

// Map platform names to types for matching
const PLATFORM_NAME_TO_TYPE: Record<string, PlatformType> = {
  tiktok: 'TIKTOK',
  youtube: 'YOUTUBE',
  instagram: 'INSTAGRAM',
  facebook: 'FACEBOOK',
};

const getPostForPlatform = (
  posts: VideoPostSummary[] | undefined,
  platformType: PlatformType,
): VideoPostSummary | undefined => {
  if (!posts) return undefined;
  return posts.find((post) => {
    // Match by platform.type if available
    if (post.platform?.type === platformType) return true;
    // Match by platform.name if available
    if (post.platform?.name) {
      const normalizedName = post.platform.name.toLowerCase();
      return PLATFORM_NAME_TO_TYPE[normalizedName] === platformType;
    }
    return false;
  });
};

const getPostStatusBadge = (status: PostStatus) => {
  const config: Record<PostStatus, { color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'; label: string }> = {
    PENDING: { color: 'gray', label: 'Pending' },
    SCHEDULED: { color: 'blue', label: 'Scheduled' },
    PUBLISHING: { color: 'yellow', label: 'Publishing' },
    PUBLISHED: { color: 'green', label: 'Published' },
    FAILED: { color: 'red', label: 'Failed' },
  };
  return <Badge color={config[status].color} size="1">{config[status].label}</Badge>;
};

export const VideoTable: React.FC = () => {
  const { hasActiveUploads } = useUploads();
  const { data, isLoading, refetch } = useVideos();
  const deleteVideo = useDeleteVideo();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (hasActiveUploads) {
      refetch();

      interval = setInterval(() => {
        refetch();
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [hasActiveUploads, refetch]);

  const handleScheduleClick = (video: Video) => {
    setSelectedVideo(video);
    setScheduleModalOpen(true);
  };

  const handleEdit = (video: Video) => {
    // TODO: Implement edit functionality
    console.log('Edit video:', video.id);
  };

  const handleDeleteClick = (video: Video) => {
    setSelectedVideo(video);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedVideo) {
      deleteVideo.mutate(selectedVideo.id, {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setSelectedVideo(null);
        },
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: 'green' | 'yellow' | 'red'; label: string }
    > = {
      READY: { color: 'green', label: 'Ready' },
      PROCESSING: { color: 'yellow', label: 'Processing' },
      FAILED: { color: 'red', label: 'Failed' },
    };

    const config = statusConfig[status] || {
      color: 'gray' as const,
      label: status,
    };
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatScheduledDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderPlatformSchedule = (post: VideoPostSummary | undefined) => {
    if (!post) {
      return <Text size="1" color="gray">—</Text>;
    }

    const scheduledDate = formatScheduledDate(post.scheduledFor || post.postedAt);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {getPostStatusBadge(post.status)}
        {scheduledDate && (
          <Text size="1" color="gray">
            {scheduledDate}
          </Text>
        )}
      </div>
    );
  };

  return (
    <>
      <DataTable<Video>
        data={data ?? []}
        columns={[
          {
            header: 'Title',
            accessor: 'title',
            id: 'title',
          },
          {
            header: 'Status',
            accessor: 'status',
            id: 'status',
            cell: (value) => getStatusBadge(value as string),
          },
          {
            header: 'Uploaded',
            accessor: 'createdAt',
            id: 'createdAt',
            cell: (value) => formatDate(value as string),
          },
          ...PLATFORMS.map((platform) => ({
            header: `${platform.label}`,
            accessor: (row: Video) => getPostForPlatform(row.posts, platform.type),
            id: `platform-${platform.type.toLowerCase()}`,
            cell: (_: unknown, row: Video) =>
              renderPlatformSchedule(getPostForPlatform(row.posts, platform.type)),
          })),
          {
            header: '',
            accessor: (row: Video) => row,
            id: 'actions',
            width: '50px',
            cell: (_: unknown, row: Video) => (
              <ActionMenu
                items={[
                  {
                    id: 'schedule',
                    label: 'Schedule',
                    icon: <CalendarIcon />,
                    onClick: () => handleScheduleClick(row),
                  },
                  {
                    id: 'edit',
                    label: 'Edit',
                    icon: <Pencil1Icon />,
                    onClick: () => handleEdit(row),
                  },
                  {
                    id: 'delete',
                    label: 'Delete',
                    icon: <TrashIcon />,
                    color: 'red',
                    onClick: () => handleDeleteClick(row),
                  },
                ]}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No videos uploaded yet"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        video={selectedVideo}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteVideo.isPending}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onOpenChange={(open) => {
          setScheduleModalOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        video={selectedVideo}
      />
    </>
  );
};
