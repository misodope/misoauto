import type { EventInput } from '@fullcalendar/core';

export interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  extendedProps?: {
    videoId?: string;
    platform?: string;
    status?: 'scheduled' | 'published' | 'failed';
    thumbnailUrl?: string;
    [key: string]: unknown;
  };
}

export interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  initialView?: 'dayGridMonth' | 'dayGridWeek' | 'dayGridDay';
  className?: string;
}
