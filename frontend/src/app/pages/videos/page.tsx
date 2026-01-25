'use client';

import { useState } from 'react';
import { Box, Flex, Heading, Button } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { UploadVideoModal } from './components';
import { VideoTable } from './components/VideoTable/VideoTable';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  status: 'processing' | 'ready' | 'error';
  platforms: string[];
  uploadDate: string;
}

export default function Videos() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <ProtectedRoute>
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Heading size="7">My Videos</Heading>
          <Button onClick={() => setUploadModalOpen(true)} size="3">
            <PlusIcon />
            Upload Video
          </Button>
        </Flex>

        <VideoTable />
      </Box>

      <UploadVideoModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />
    </ProtectedRoute>
  );
}
