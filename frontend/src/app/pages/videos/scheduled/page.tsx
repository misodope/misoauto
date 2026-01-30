'use client';

import { useMemo } from 'react';
import { Box, Heading, Text, Spinner, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Calendar, CalendarEvent } from '../components';
import {
  useVideoPosts,
  VideoPost,
  PostStatus,
} from '@frontend/app/hooks/apis/video-posts';

const mapStatusToCalendarStatus = (
  status: PostStatus,
): 'scheduled' | 'published' | 'failed' => {
  switch (status) {
    case 'PUBLISHED':
      return 'published';
    case 'FAILED':
      return 'failed';
    default:
      return 'scheduled';
  }
};

const mapVideoPostToCalendarEvent = (post: VideoPost): CalendarEvent => {
  const startDate = post.scheduledFor || post.createdAt;

  return {
    id: post.id.toString(),
    title: `${post.video.title} - ${post.platform.name}`,
    start: startDate,
    allDay: false,
    extendedProps: {
      videoId: post.videoId.toString(),
      videoPostId: post.id,
      platform: post.platform.name.toLowerCase(),
      status: mapStatusToCalendarStatus(post.status),
      thumbnailUrl: undefined,
      username: post.socialAccount.username,
      postUrl: post.postUrl,
    },
  };
};

export default function ScheduledPage() {
  const { data: videoPosts, isLoading, error } = useVideoPosts();

  const events = useMemo(() => {
    if (!videoPosts) return [];
    return videoPosts.map(mapVideoPostToCalendarEvent);
  }, [videoPosts]);

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
  };

  return (
    <Box>
      <Box mb="6">
        <Heading size="6" mb="2">
          Scheduled Videos
        </Heading>
        <Text color="gray">View and manage your scheduled video posts</Text>
      </Box>

      {isLoading && (
        <Box py="8" style={{ textAlign: 'center' }}>
          <Spinner size="3" />
        </Box>
      )}

      {error && (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Failed to load scheduled posts. Please try again.
          </Callout.Text>
        </Callout.Root>
      )}

      {!isLoading && !error && (
        <Calendar
          events={events}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      )}
    </Box>
  );
}
