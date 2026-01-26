'use client';

import { Box, Heading, Text } from '@radix-ui/themes';
import { Calendar, CalendarEvent } from '../components';

// Example events - replace with actual data from API
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Video Post - TikTok',
    start: new Date().toISOString(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
    allDay: false,
    extendedProps: {
      videoId: 'vid-1',
      platform: 'tiktok',
      status: 'scheduled',
    },
  },
];

export default function ScheduledPage() {
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

      <Calendar
        events={mockEvents}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
      />
    </Box>
  );
}
