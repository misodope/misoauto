'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Flex, Text, Button, Card } from '@radix-ui/themes';

export interface DashboardCardProps {
  title: string;
  description: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
  muted?: boolean;
}

export default function DashboardCard({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  children,
  muted = false,
}: DashboardCardProps) {
  return (
    <Card
      size="3"
      style={
        muted
          ? {
              filter: 'grayscale(0.8)',
              opacity: 0.58,
            }
          : undefined
      }
    >
      <Flex direction="column" gap="3">
        <Text size="5" weight="bold">
          {title}
        </Text>
        <Text size="2" color="gray">
          {description}
        </Text>
        {children}
        {actionLabel && actionHref && (
          <Button asChild variant="soft" mt="2">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
        {actionLabel && !actionHref && onAction && (
          <Button variant="soft" mt="2" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
