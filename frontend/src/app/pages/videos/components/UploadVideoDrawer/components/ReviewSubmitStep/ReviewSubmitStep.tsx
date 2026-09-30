'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Text, TextArea, TextField } from '@radix-ui/themes';

interface ReviewSubmitStepProps {
  file: File | null;
  thumbnail: Blob | null;
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export default function ReviewSubmitStep({
  file,
  thumbnail,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: ReviewSubmitStepProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailUrl(null);
      return;
    }

    const url = URL.createObjectURL(thumbnail);
    setThumbnailUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  return (
    <Flex direction="column" gap="4">
      {thumbnailUrl && (
        <Box>
          <Flex justify="center">
            <img
              src={thumbnailUrl}
              alt="Chosen video thumbnail"
              style={{
                aspectRatio: '9 / 16',
                background: 'var(--gray-3)',
                borderRadius: '8px',
                display: 'block',
                height: 'min(480px, 50vh)',
                maxWidth: '100%',
                objectFit: 'contain',
                width: 'auto',
              }}
            />
          </Flex>
          <Text size="1" color="gray" mt="2">
            {file?.name}
          </Text>
        </Box>
      )}
      <Box>
        <Text
          as="label"
          htmlFor="upload-video-title"
          size="2"
          weight="medium"
          mb="2"
        >
          Title *
        </Text>
        <TextField.Root
          id="upload-video-title"
          placeholder="Enter video title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </Box>
      <Box>
        <Text
          as="label"
          htmlFor="upload-video-description"
          size="2"
          weight="medium"
          mb="2"
        >
          Description
        </Text>
        <TextArea
          id="upload-video-description"
          placeholder="Enter video description (optional)"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={2}
        />
      </Box>
    </Flex>
  );
}
