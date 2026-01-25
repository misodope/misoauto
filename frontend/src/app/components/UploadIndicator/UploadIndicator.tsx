'use client';

import {
  HoverCard,
  Flex,
  Text,
  Box,
  Progress,
  IconButton,
  Badge,
} from '@radix-ui/themes';
import {
  UploadIcon,
  Cross2Icon,
  CheckCircledIcon,
  CrossCircledIcon,
} from '@radix-ui/react-icons';
import { useUploads, Upload, UploadStatus } from '../../contexts/UploadContext';
import styles from './UploadIndicator.module.scss';

const getStatusLabel = (status: UploadStatus): string => {
  switch (status) {
    case 'initializing':
      return 'Initializing...';
    case 'uploading':
      return 'Uploading';
    case 'confirming':
      return 'Confirming...';
    case 'completed':
      return 'Completed';
    case 'error':
      return 'Failed';
    default:
      return status;
  }
};

const getStatusColor = (
  status: UploadStatus,
): 'blue' | 'green' | 'red' | 'yellow' => {
  switch (status) {
    case 'initializing':
    case 'confirming':
      return 'yellow';
    case 'uploading':
      return 'blue';
    case 'completed':
      return 'green';
    case 'error':
      return 'red';
    default:
      return 'blue';
  }
};

interface UploadItemProps {
  upload: Upload;
  onCancel: (id: string) => void;
  onClear: (id: string) => void;
}

function UploadItem({ upload, onCancel, onClear }: UploadItemProps) {
  const isActive =
    upload.status === 'initializing' ||
    upload.status === 'uploading' ||
    upload.status === 'confirming';
  const isCompleted = upload.status === 'completed';
  const isError = upload.status === 'error';

  return (
    <Box className={styles.uploadItem}>
      <Flex justify="between" align="start" gap="2" mb="1">
        <Text
          size="2"
          weight="medium"
          className={styles.filename}
          title={upload.filename}
        >
          {upload.title || upload.filename}
        </Text>
        <Flex align="center" gap="1">
          {isCompleted && <CheckCircledIcon color="var(--green-9)" />}
          {isError && <CrossCircledIcon color="var(--red-9)" />}
          {isActive && (
            <IconButton
              size="1"
              variant="ghost"
              color="red"
              onClick={() => onCancel(upload.id)}
              title="Cancel upload"
            >
              <Cross2Icon />
            </IconButton>
          )}
          {!isActive && (
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              onClick={() => onClear(upload.id)}
              title="Remove"
            >
              <Cross2Icon />
            </IconButton>
          )}
        </Flex>
      </Flex>

      <Flex align="center" gap="2">
        <Box style={{ flex: 1 }}>
          <Progress
            value={upload.progress}
            size="1"
            color={getStatusColor(upload.status)}
          />
        </Box>
        <Text size="1" color="gray">
          {upload.progress}%
        </Text>
      </Flex>

      <Flex justify="between" align="center" mt="1">
        <Text size="1" color="gray">
          {getStatusLabel(upload.status)}
        </Text>
        {upload.error && (
          <Text size="1" color="red">
            {upload.error}
          </Text>
        )}
      </Flex>
    </Box>
  );
}

export default function UploadIndicator() {
  const {
    uploads,
    activeCount,
    hasActiveUploads,
    cancelUpload,
    clearUpload,
    clearCompleted,
  } = useUploads();

  const uploadsArray = Array.from(uploads.values());
  const hasUploads = uploadsArray.length > 0;

  return (
    <HoverCard.Root openDelay={100} closeDelay={200}>
      <HoverCard.Trigger>
        <Box className={styles.trigger}>
          <IconButton
            size="2"
            variant="ghost"
            className={
              hasActiveUploads
                ? styles.active
                : !hasUploads
                  ? styles.disabled
                  : undefined
            }
          >
            <UploadIcon width={18} height={18} />
          </IconButton>
          {activeCount > 0 && (
            <Badge size="1" color="blue" className={styles.badge}>
              {activeCount}
            </Badge>
          )}
        </Box>
      </HoverCard.Trigger>

      <HoverCard.Content side="bottom" align="end" className={styles.content}>
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="2" weight="bold">
              Uploads
            </Text>
            {uploadsArray.some(
              (u) => u.status === 'completed' || u.status === 'error',
            ) && (
              <Text
                size="1"
                color="gray"
                className={styles.clearLink}
                onClick={clearCompleted}
              >
                Clear finished
              </Text>
            )}
          </Flex>

          <Box className={styles.uploadsList}>
            {uploadsArray.length === 0 ? (
              <Text size="2" color="gray">
                No active uploads
              </Text>
            ) : (
              uploadsArray.map((upload) => (
                <UploadItem
                  key={upload.id}
                  upload={upload}
                  onCancel={cancelUpload}
                  onClear={clearUpload}
                />
              ))
            )}
          </Box>
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  );
}
