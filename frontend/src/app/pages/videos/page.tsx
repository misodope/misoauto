'use client';

import { useState } from 'react';
import { Box, Flex, Heading, Button } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { UploadVideoDrawer } from './components';
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
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);

  return (
    <ProtectedRoute>
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Heading size="7">My Videos</Heading>
          <Button onClick={() => setUploadDrawerOpen(true)} size="3">
            <PlusIcon />
            Upload Video
          </Button>
        </Flex>

        <VideoTable />
      </Box>

      <UploadVideoDrawer
        open={uploadDrawerOpen}
        onOpenChange={setUploadDrawerOpen}
      />
    </ProtectedRoute>
  );
}
