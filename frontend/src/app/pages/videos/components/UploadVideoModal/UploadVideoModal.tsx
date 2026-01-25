'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  Box,
  Flex,
  Heading,
  Button,
  Text,
  TextArea,
  TextField,
  Separator,
} from '@radix-ui/themes';
import { UploadIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useUploads } from '../../../../contexts/UploadContext';
import PlatformSelection, {
  PlatformSelectionState,
  getDefaultPlatformState,
} from '../PlatformSelection';

interface UploadVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadVideoModal({
  open,
  onOpenChange,
}: UploadVideoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startVideoUpload } = useUploads();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<PlatformSelectionState>(
    getDefaultPlatformState(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setPlatforms(getDefaultPlatformState());
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
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

    // TODO: Include platform selection in the upload metadata
    const enabledPlatforms = Object.entries(platforms)
      .filter(([, config]) => config.enabled)
      .map(([key, config]) => ({ platform: key, caption: config.caption }));

    console.log('Enabled platforms:', enabledPlatforms);

    startVideoUpload({
      file,
      title: title.trim(),
      description: description.trim() || undefined,
      onComplete: () => {
        resetForm();
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });

    onOpenChange(false);
  };

  const isValid = file && title.trim();

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Upload Video</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Upload a video to your library
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* File Selection */}
          <Box>
            <Text size="2" weight="medium" mb="2">
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
                onClick={handleFileSelect}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed var(--gray-7)',
                  borderRadius: '8px',
                  padding: '32px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'var(--gray-2)',
                }}
              >
                <Flex direction="column" align="center" gap="2">
                  <UploadIcon width="24" height="24" />
                  <Text size="2" weight="medium">
                    Click or drag to select
                  </Text>
                  <Text size="1" color="gray">
                    MP4, MOV, AVI (Max 500MB)
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
            <Text size="2" weight="medium" mb="2">
              Title *
            </Text>
            <TextField.Root
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>

          {/* Description */}
          <Box>
            <Text size="2" weight="medium" mb="2">
              Description
            </Text>
            <TextArea
              placeholder="Enter video description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Box>
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isSubmitting}>
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Starting Upload...' : 'Upload Video'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
