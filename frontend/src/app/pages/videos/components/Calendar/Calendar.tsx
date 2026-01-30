'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { Box } from '@radix-ui/themes';
import { EventInfoPanel } from './EventInfoPanel';
import type { CalendarProps, CalendarEvent } from './types';
import styles from './Calendar.module.scss';

export const Calendar = ({
  events,
  onEventClick,
  onDateClick,
  initialView = 'dayGridMonth',
  className,
}: CalendarProps) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [panelOpen, setPanelOpen] = useState(false);

  const handleEventClick = (info: EventClickArg) => {
    const event: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start || new Date(),
      end: info.event.end || undefined,
      allDay: info.event.allDay,
      extendedProps: info.event.extendedProps as CalendarEvent['extendedProps'],
    };

    setSelectedEvent(event);
    setPanelOpen(true);

    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleDateClick = (info: DateSelectArg) => {
    if (onDateClick) {
      onDateClick(info.start);
    }
  };

  const calendarClasses = [styles.calendar, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Box className={calendarClasses}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView={initialView}
        events={events}
        eventClick={handleEventClick}
        select={handleDateClick}
        selectable={!!onDateClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay',
        }}
        height="auto"
      />

      <EventInfoPanel
        event={selectedEvent}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </Box>
  );
};

export default Calendar;
