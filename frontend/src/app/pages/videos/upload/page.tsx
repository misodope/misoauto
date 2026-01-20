'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import {
  Box,
  Flex,
  Heading,
  Button,
  Card,
  Text,
  TextField,
  TextArea,
  Switch,
  Separator,
} from '@radix-ui/themes';
import { ArrowLeftIcon, UploadIcon } from '@radix-ui/react-icons';
import ProtectedRoute from '../../../components/ProtectedRoute/ProtectedRoute';

interface PlatformConfig {
  name: string;
  enabled: boolean;
  caption: string;
}

interface FormData {
  file: File | null;
  platforms: {
    tiktok: PlatformConfig;
    youtube: PlatformConfig;
    instagram: PlatformConfig;
    facebook: PlatformConfig;
  };
}

export default function UploadVideo() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    file: null,
    platforms: {
      tiktok: { name: 'TikTok', enabled: false, caption: '' },
      youtube: { name: 'YouTube', enabled: false, caption: '' },
      instagram: { name: 'Instagram', enabled: false, caption: '' },
      facebook: { name: 'Facebook', enabled: false, caption: '' },
    },
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handlePlatformToggle = (platform: keyof FormData['platforms']) => {
    setFormData((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform],
          enabled: !prev.platforms[platform].enabled,
        },
      },
    }));
  };

  const handleCaptionChange = (
    platform: keyof FormData['platforms'],
    caption: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform],
          caption,
        },
      },
    }));
  };

  const handleSubmit = () => {
    console.log('Uploading video with data:', formData);
  };

  const goBack = () => {
    router.push('/videos');
  };

  return (
    <ProtectedRoute>
      <Box p="6">
        <Flex align="center" gap="4" mb="6">
          <Button variant="ghost" size="2" onClick={goBack}>
            <ArrowLeftIcon />
          </Button>
          <Heading size="7">Upload New Video</Heading>
        </Flex>

        <Card size="3" mb="6">
          <Flex direction="column" gap="4">
            <Heading size="4">Select Video File</Heading>

            <Box
              onClick={handleFileSelect}
              style={{
                border: '2px dashed var(--gray-7)',
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: formData.file
                  ? 'var(--accent-2)'
                  : 'var(--gray-2)',
              }}
            >
              <Flex direction="column" align="center" gap="3">
                <UploadIcon width="32" height="32" />
                {formData.file ? (
                  <>
                    <Text size="4" weight="medium">
                      {formData.file.name}
                    </Text>
                    <Text size="2" color="gray">
                      {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                    </Text>
                  </>
                ) : (
                  <>
                    <Text size="4" weight="medium">
                      Click to select a video file
                    </Text>
                    <Text size="2" color="gray">
                      Supports MP4, MOV, AVI (Max 500MB)
                    </Text>
                  </>
                )}
              </Flex>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Flex>
        </Card>

        <Box>
          <Flex direction="column" gap="4">
            <Heading size="5">Platforms to Upload</Heading>

            {Object.entries(formData.platforms).map(([key, platform]) => (
              <Card key={key} size="3" style={{ width: '500px' }}>
                <Flex direction="column" gap="4">
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="3">
                      <Heading size="4">{platform.name}</Heading>
                      <Text color="gray">
                        {platform.enabled ? 'Enabled' : 'Disabled'}
                      </Text>
                    </Flex>
                    <Switch
                      checked={platform.enabled}
                      onCheckedChange={() =>
                        handlePlatformToggle(key as keyof FormData['platforms'])
                      }
                    />
                  </Flex>

                  {platform.enabled && (
                    <>
                      <Separator size="4" />
                      <Box style={{ width: '100%' }}>
                        <Text as="label" size="2" weight="medium" mb="2">
                          Caption
                        </Text>
                        <TextArea
                          placeholder={`Enter caption for ${platform.name}...`}
                          value={platform.caption}
                          onChange={(e: any) =>
                            handleCaptionChange(
                              key as keyof FormData['platforms'],
                              e.target.value,
                            )
                          }
                          rows={3}
                          style={{ width: '100%' }}
                        />
                      </Box>
                    </>
                  )}
                </Flex>
              </Card>
            ))}
          </Flex>
        </Box>

        <Flex justify="end" gap="3" mt="8">
          <Button variant="outline" size="3" onClick={goBack}>
            Cancel
          </Button>
          <Button
            size="3"
            onClick={handleSubmit}
            disabled={
              !formData.file ||
              !Object.values(formData.platforms).some((p) => p.enabled)
            }
          >
            Upload Video
          </Button>
        </Flex>
      </Box>
    </ProtectedRoute>
  );
}
