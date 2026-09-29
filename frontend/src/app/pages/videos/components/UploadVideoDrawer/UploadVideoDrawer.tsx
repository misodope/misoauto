'use client';

import { useState, useRef } from 'react';
import { Box, Flex, Button, Text, TextArea, TextField } from '@radix-ui/themes';
import { UploadIcon, Cross2Icon } from '@radix-ui/react-icons';
import Drawer from '@frontend/app/components/Drawer';
import { useUploads } from '../../../../contexts/UploadContext';

interface UploadVideoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadVideoDrawer({
  open,
  onOpenChange,
}: UploadVideoDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startVideoUpload } = useUploads();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSubmitting) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      if (!title) {
        const nameWithoutExt = droppedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = () => {
    if (!file || !title.trim()) return;

    setIsSubmitting(true);

    startVideoUpload({
      file,
      title: title.trim(),
      description: description.trim() || undefined,
      onComplete: () => {
        resetForm();
        onOpenChange(false);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  };

  const isValid = file && title.trim();

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      title="Upload video"
      description="Add a video to your library"
      width={500}
    >
      <Flex direction="column" gap="4">
        {/* File Selection */}
        <Box>
          <Text
            id="upload-video-file-label"
            size="2"
            weight="medium"
            mb="2"
          >
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
              <Flex justify="between" align="center">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    {file.name}
                  </Text>
                  <Text size="1" color="gray">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </Flex>
                <Button
                  variant="ghost"
                  color="gray"
                  size="1"
                  onClick={handleRemoveFile}
                >
                  <Cross2Icon />
                </Button>
              </Flex>
            </Box>
          ) : (
            <Box
              role="button"
              tabIndex={0}
              onClick={handleFileSelect}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFileSelect();
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
                  <span id="upload-video-help">
                    MP4, MOV, AVI (Max 500MB)
                  </span>
                </Text>
              </Flex>
            </Box>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </Box>

        {/* Title */}
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
            onChange={(e) => setTitle(e.target.value)}
          />
        </Box>

        {/* Description */}
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
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </Box>

        <Flex justify="end" gap="3" mt="2">
          <Button
            variant="soft"
            color="gray"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
          >
            Upload video
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}
