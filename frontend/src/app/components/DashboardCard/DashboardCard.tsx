'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Flex, Text, Button, Card } from '@radix-ui/themes';

export interface DashboardCardProps {
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
  muted?: boolean;
  compact?: boolean;
  cardSize?: '1' | '2' | '3';
}

export default function DashboardCard({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  children,
  muted = false,
  compact = false,
  cardSize,
}: DashboardCardProps) {
  return (
    <Card
      size={cardSize ?? (compact ? '2' : '3')}
      style={{
        ...(compact ? { padding: '12px' } : {}),
        ...(muted
          ? {
              filter: 'grayscale(0.8)',
              opacity: 0.58,
            }
          : {}),
      }}
    >
      <Flex
        direction={compact ? 'row' : 'column'}
        align={compact ? 'center' : undefined}
        gap="3"
      >
        {compact && children}
        <Flex direction="column" gap={compact ? '1' : '3'} style={{ flex: 1 }}>
          <Text size={compact ? '3' : '5'} weight="bold">
            {title}
          </Text>
          {description && (
            <Text size={compact ? '1' : '2'} color="gray">
              {description}
            </Text>
          )}
          {!compact && children}
          {actionLabel && actionHref && (
            <Button
              asChild
              variant="soft"
              size={compact ? '1' : '2'}
              mt={compact ? '1' : '2'}
            >
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          )}
          {actionLabel && !actionHref && onAction && (
            <Button
              variant="soft"
              size={compact ? '1' : '2'}
              mt={compact ? '1' : '2'}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
