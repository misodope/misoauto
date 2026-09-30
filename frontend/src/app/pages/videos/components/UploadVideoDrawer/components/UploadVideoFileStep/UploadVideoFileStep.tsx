'use client';

import { useEffect, useRef } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { Cross2Icon, UploadIcon } from '@radix-ui/react-icons';

interface UploadVideoFileStepProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
}

export default function UploadVideoFileStep({
  file,
  onFileSelect,
  onRemoveFile,
}: UploadVideoFileStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file && fileInputRef.current) fileInputRef.current.value = '';
  }, [file]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile?.type.startsWith('video/')) onFileSelect(droppedFile);
  };

  return (
    <Box>
      <Text id="upload-video-file-label" size="2" weight="medium" mb="2">
        Video File *
      </Text>
      {file ? (
        <Box
          style={{
            border: '2px solid var(--accent-7)',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: 'var(--accent-2)',
          }}
        >
          <Flex justify="between" align="center" gap="3">
            <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
              <Text size="2" weight="medium" style={{ overflowWrap: 'anywhere' }}>
                {file.name}
              </Text>
              <Text size="1" color="gray">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Text>
            </Flex>
            <Button
              type="button"
              variant="ghost"
              color="gray"
              size="1"
              aria-label="Remove selected video"
              onClick={onRemoveFile}
            >
              <Cross2Icon />
            </Button>
          </Flex>
        </Box>
      ) : (
        <Box
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          aria-labelledby="upload-video-file-label"
          aria-describedby="upload-video-help"
          style={{
            border: '2px dashed var(--gray-7)',
            borderRadius: '8px',
            padding: '32px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: 'var(--gray-2)',
            color: 'inherit',
            font: 'inherit',
            width: '100%',
          }}
        >
          <Flex direction="column" align="center" gap="2">
            <UploadIcon width="24" height="24" />
            <Text size="2" weight="medium">
              Click or drag to select
            </Text>
            <Text size="1" color="gray">
              <span id="upload-video-help">MP4, MOV, AVI (Max 500MB)</span>
            </Text>
          </Flex>
        </Box>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) onFileSelect(selectedFile);
        }}
        style={{ display: 'none' }}
      />
    </Box>
  );
}
