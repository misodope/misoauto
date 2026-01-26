import React, { useEffect, useState } from 'react';
import { Badge } from '@radix-ui/themes';
import { CalendarIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

import { DataTable } from '@frontend/app/components/DataTable';
import ActionMenu from '@frontend/app/components/ActionMenu';
import {
  useVideos,
  useDeleteVideo,
  Video,
} from '@frontend/app/hooks/apis/videos/use-videos';
import { useUploads } from '@frontend/app/contexts/UploadContext/uploadContext';
import DeleteModal from '../DeleteModal';
import ScheduleModal, { ScheduleFormState } from '../ScheduleModal';

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

  const handleScheduleConfirm = (scheduleData: ScheduleFormState) => {
    // TODO: Implement schedule API call
    console.log('Schedule video:', selectedVideo?.id, scheduleData);
    setScheduleModalOpen(false);
    setSelectedVideo(null);
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
            header: 'Description',
            accessor: 'description',
            id: 'description',
            cell: (value) => (value as string) || '—',
          },
          {
            header: 'Status',
            accessor: 'status',
            id: 'status',
            cell: (value) => getStatusBadge(value as string),
          },
          {
            header: 'Upload Date',
            accessor: 'createdAt',
            id: 'createdAt',
            cell: (value) => formatDate(value as string),
          },
          {
            header: '',
            accessor: (row) => row,
            id: 'actions',
            width: '50px',
            cell: (_, row) => (
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
        onConfirm={handleScheduleConfirm}
      />
    </>
  );
};
