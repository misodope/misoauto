'use client';

import { useEffect, useState } from 'react';
import { Card, Flex, Spinner, Text } from '@radix-ui/themes';
import styles from './ProgressOverlay.module.scss';

export interface ProgressOverlayProps {
  /** Whether the overlay is shown */
  open: boolean;
  /** Headline, e.g. "Publishing to Instagram…" */
  title: string;
  /** Current human-readable status line */
  message?: string | null;
  /** Secondary hint shown under the message */
  hint?: string;
}

const formatElapsed = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Full-screen blocking overlay for long-running work. Renders with fixed
 * positioning and captures all pointer input, so pair it with a container
 * that also blocks Escape/outside-click (e.g. Drawer `preventClose`).
 */
export default function ProgressOverlay({
  open,
  title,
  message,
  hint = 'This can take a few minutes. Please keep this tab open.',
}: ProgressOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!open) return;

    const startedAt = Date.now();
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
    >
      <Card size="3" className={styles.card}>
        <Flex direction="column" align="center" gap="3">
          <Spinner size="3" />
          <Text size="4" weight="bold" align="center">
            {title}
          </Text>
          {message && (
            <Text size="2" color="gray" align="center">
              {message}
            </Text>
          )}
          <Text size="1" color="gray" align="center">
            {hint}
          </Text>
          <Text size="1" color="gray">
            Elapsed {formatElapsed(elapsedSeconds)}
          </Text>
        </Flex>
      </Card>
    </div>
  );
}
