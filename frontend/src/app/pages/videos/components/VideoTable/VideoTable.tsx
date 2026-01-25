import React, { useEffect } from 'react';

import { DataTable } from '@frontend/app/components/DataTable';
import { useVideos, Video } from '@frontend/app/hooks/apis/videos/use-videos';
import { useUploads } from '@frontend/app/contexts/UploadContext/uploadContext';

export const VideoTable: React.FC = () => {
  const { hasActiveUploads } = useUploads();
  const { data, isLoading, refetch } = useVideos();

  useEffect(() => {
    console.log('hasActiveUploads', hasActiveUploads);
    let interval: NodeJS.Timeout;

    if (hasActiveUploads) {
      refetch();

      interval = setInterval(() => {
        refetch();
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [hasActiveUploads, refetch]);

  return (
    <DataTable<Video>
      data={data ?? []}
      columns={[
        {
          header: 'ID',
          accessor: 'id',
          id: 'id',
        },
        {
          header: 'Title',
          accessor: 'title',
          id: 'title',
        },
        {
          header: 'Description',
          accessor: 'description',
          id: 'description',
        },
        {
          header: 'Status',
          accessor: 'status',
          id: 'status',
        },
        {
          header: 'Upload Date',
          accessor: 'createdAt',
          id: 'createdAt',
        },
      ]}
      loading={isLoading}
    />
  );
};
