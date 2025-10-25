'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Heading, Button, Card, Text, Badge, Grid } from '@radix-ui/themes';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  status: 'processing' | 'ready' | 'error';
  platforms: string[];
  uploadDate: string;
}

export default function Videos() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([
    {
      id: '1',
      title: 'Sample Video 1',
      thumbnail: 'https://via.placeholder.com/320x180',
      status: 'ready',
      platforms: ['TikTok', 'YouTube'],
      uploadDate: '2024-01-20',
    },
  ]);

  useEffect(() => {
    console.log('Videos page mounted');
  }, []);

  const handleUpload = () => {
    router.push('/videos/upload');
  };

  return (
    <ProtectedRoute>
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Heading size="7">My Videos</Heading>
          <Button onClick={handleUpload} size="3">
            Upload New Video
          </Button>
        </Flex>

        <Grid columns="3" gap="4">
          {videos.map((video) => (
            <Card key={video.id} size="2">
              <Box position="relative" mb="3">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <Badge
                  color={video.status === 'ready' ? 'green' : video.status === 'processing' ? 'yellow' : 'red'}
                  style={{ position: 'absolute', top: '8px', right: '8px' }}
                >
                  {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                </Badge>
              </Box>
              <Box>
                <Heading size="4" mb="2">{video.title}</Heading>
                <Text size="2" color="gray" mb="2">Uploaded on {video.uploadDate}</Text>
                <Flex gap="1" wrap="wrap">
                  {video.platforms.map((platform) => (
                    <Badge key={platform} variant="soft">
                      {platform}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </Card>
          ))}
        </Grid>
      </Box>
    </ProtectedRoute>
  );
}