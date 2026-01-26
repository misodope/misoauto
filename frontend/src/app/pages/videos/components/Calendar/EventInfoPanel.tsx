'use client';

import { Dialog, Flex, Text, Badge, Box, IconButton } from '@radix-ui/themes';
import { Cross2Icon, CalendarIcon, VideoIcon } from '@radix-ui/react-icons';
import type { CalendarEvent } from './types';
import styles from './EventInfoPanel.module.scss';
import Drawer from '@frontend/app/components/Drawer/Drawer';

interface EventInfoPanelProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'published':
      return 'green';
    case 'failed':
      return 'red';
    case 'scheduled':
    default:
      return 'yellow';
  }
};

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const EventInfoPanel = ({
  event,
  open,
  onOpenChange,
}: EventInfoPanelProps) => {
  if (!event) return null;

  const status = event.extendedProps?.status;
  const platform = event.extendedProps?.platform;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={event.title}>
      <Flex direction="column" gap="4">
        {/* Status Badge */}
        {status && (
          <Flex align="center" gap="2">
            <Text size="2" color="gray">
              Status:
            </Text>
            <Badge color={getStatusColor(status)} variant="soft">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </Flex>
        )}

        {/* Platform */}
        {platform && (
          <Flex align="center" gap="2">
            <Text size="2" color="gray">
              Platform:
            </Text>
            <Badge variant="outline">
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Badge>
          </Flex>
        )}

        {/* Scheduled Date */}
        <Box>
          <Flex align="center" gap="2" mb="1">
            <CalendarIcon />
            <Text size="2" color="gray">
              Scheduled for
            </Text>
          </Flex>
          <Text size="3">{formatDate(event.start)}</Text>
        </Box>

        {/* Video ID */}
        {event.extendedProps?.videoId && (
          <Box>
            <Flex align="center" gap="2" mb="1">
              <VideoIcon />
              <Text size="2" color="gray">
                Video ID
              </Text>
            </Flex>
            <Text size="2" className={styles.videoId}>
              {event.extendedProps.videoId}
            </Text>
          </Box>
        )}

        {/* Thumbnail */}
        {event.extendedProps?.thumbnailUrl && (
          <Box>
            <Text size="2" color="gray" mb="2">
              Thumbnail
            </Text>
            <img
              src={event.extendedProps.thumbnailUrl}
              alt={event.title}
              className={styles.thumbnail}
            />
          </Box>
        )}
      </Flex>
    </Drawer>
  );
};

export default EventInfoPanel;
