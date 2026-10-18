const SCHEDULE_ROUNDING_MINUTES = 5;

const roundUpToMinutes = (date: Date, minutes: number): Date => {
  const rounded = new Date(date);
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / minutes) * minutes, 0, 0);
  return rounded;
};

/** Formats a Date as the local-time value a datetime-local input expects. */
export const toDateTimeLocalValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Earliest allowed schedule time: now + 10 minutes, rounded up to 5 minutes. */
export const getMinScheduleDateTime = (): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  return toDateTimeLocalValue(
    roundUpToMinutes(date, SCHEDULE_ROUNDING_MINUTES),
  );
};

/** Default schedule time: now + 1 hour, rounded up to 5 minutes. */
export const getDefaultScheduleDateTime = (): string => {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return toDateTimeLocalValue(
    roundUpToMinutes(date, SCHEDULE_ROUNDING_MINUTES),
  );
};

/** Short local date + time, e.g. "Oct 18, 3:30 PM". */
export const formatScheduledDate = (
  dateString: string | undefined,
): string | null => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
