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
}

export default function DashboardCard({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  children,
}: DashboardCardProps) {
  return (
    <Card size="3">
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
