import React, { useEffect, useState } from 'react';
import { Badge, Flex, Text } from '@radix-ui/themes';
import {
  CalendarIcon,
  ClockIcon,
  Pencil1Icon,
  TrashIcon,
  UploadIcon,
} from '@radix-ui/react-icons';

import { DataTable } from '@frontend/app/components/DataTable';
import ActionMenu from '@frontend/app/components/ActionMenu';
import {
  useVideos,
  useDeleteVideo,
  Video,
  VideoPostSummary,
  PlatformType,
} from '@frontend/app/hooks/apis/videos/use-videos';
import { formatScheduledDate } from '@frontend/app/lib/dates';
import { useUploads } from '@frontend/app/contexts/UploadContext/uploadContext';
import DeleteModal from '../DeleteModal';
import ScheduleModal from '../ScheduleModal';
import ManageScheduleModal from '../ManageScheduleModal';
import PostStatusBadge from '../PostStatusBadge';
import PublishVideoDrawer from '../PublishVideoDrawer';

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

const matchesPlatform = (
  post: VideoPostSummary,
  platformType: PlatformType,
): boolean => {
  // Match by platform.type if available
  if (post.platform?.type === platformType) return true;
  // Match by platform.name if available
  if (post.platform?.name) {
    const normalizedName = post.platform.name.toLowerCase();
    return PLATFORM_NAME_TO_TYPE[normalizedName] === platformType;
  }
  return false;
};

/** Latest post for the platform, so an older unscheduled post can't mask a newer one. */
const getPostForPlatform = (
  posts: VideoPostSummary[] | undefined,
  platformType: PlatformType,
): VideoPostSummary | undefined => {
  if (!posts) return undefined;
  return posts
    .filter((post) => matchesPlatform(post, platformType))
    .reduce<VideoPostSummary | undefined>(
      (latest, post) =>
        !latest || new Date(post.createdAt) > new Date(latest.createdAt)
          ? post
          : latest,
      undefined,
    );
};

const hasManageableSchedule = (video: Video): boolean =>
  Boolean(
    video.posts?.some(
      (post) => post.status === 'SCHEDULED' || post.status === 'PENDING',
    ),
  );

export const VideoTable: React.FC = () => {
  const { hasActiveUploads } = useUploads();
  const { data, isLoading, refetch } = useVideos();
  const deleteVideo = useDeleteVideo();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
  const [manageScheduleOpen, setManageScheduleOpen] = useState(false);
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

  const handlePublishClick = (video: Video) => {
    setSelectedVideo(video);
    setPublishDrawerOpen(true);
  };

  const handleScheduleClick = (video: Video) => {
    setSelectedVideo(video);
    setScheduleModalOpen(true);
  };

  const handleManageScheduleClick = (video: Video) => {
    setSelectedVideo(video);
    setManageScheduleOpen(true);
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

  const renderPlatformSchedule = (post: VideoPostSummary | undefined) => {
    if (!post) {
      return (
        <Text size="1" color="gray">
          —
        </Text>
      );
    }

    const scheduledDate = formatScheduledDate(
      post.scheduledFor || post.postedAt,
    );

    return (
      <Flex direction="column" gap="1">
        <PostStatusBadge status={post.status} />
        {scheduledDate && (
          <Text size="1" color="gray">
            {scheduledDate}
          </Text>
        )}
      </Flex>
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
            accessor: (row: Video) =>
              getPostForPlatform(row.posts, platform.type),
            id: `platform-${platform.type.toLowerCase()}`,
            cell: (_: unknown, row: Video) =>
              renderPlatformSchedule(
                getPostForPlatform(row.posts, platform.type),
              ),
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
                    id: 'upload',
                    label: 'Platform Upload',
                    icon: <UploadIcon />,
                    onClick: () => handlePublishClick(row),
                  },
                  {
                    id: 'schedule',
                    label: 'Schedule',
                    icon: <CalendarIcon />,
                    onClick: () => handleScheduleClick(row),
                  },
                  {
                    id: 'manage-schedule',
                    label: 'Manage schedule',
                    icon: <ClockIcon />,
                    onClick: () => handleManageScheduleClick(row),
                    disabled: !hasManageableSchedule(row),
                  },
                  // {
                  //   id: 'edit',
                  //   label: 'Edit',
                  //   icon: <Pencil1Icon />,
                  //   onClick: () => handleEdit(row),
                  // },
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

      <ManageScheduleModal
        isOpen={manageScheduleOpen}
        onOpenChange={(open) => {
          setManageScheduleOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        video={selectedVideo}
      />

      <PublishVideoDrawer
        open={publishDrawerOpen}
        onOpenChange={(open) => {
          setPublishDrawerOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        video={selectedVideo}
      />
    </>
  );
};
