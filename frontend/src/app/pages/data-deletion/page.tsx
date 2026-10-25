'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Flex,
  Heading,
  Link as RadixLink,
  Spinner,
  Text,
} from '@radix-ui/themes';
import { AxiosError } from 'axios';
import { Footer } from '../../components/Footer';
import {
  DataDeletionApiError,
  useDataDeletionStatus,
} from '../../hooks/apis/data-deletion/use-data-deletion';

const SUPPORT_EMAIL = 'jerry+support@misodope.com';

function SupportLink() {
  return (
    <Text as="p" color="gray">
      Need help?{' '}
      <RadixLink href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</RadixLink>
    </Text>
  );
}

function formatDate(value: string | null): string {
  if (!value) return 'Not yet completed';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

function DataDeletionContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const query = useDataDeletionStatus(code);

  if (!code) {
    return (
      <Flex direction="column" gap="3">
        <Text as="p">
          Enter the confirmation code from your deletion request.
        </Text>
        <SupportLink />
      </Flex>
    );
  }

  if (query.isPending) {
    return (
      <Flex align="center" gap="2">
        <Spinner />
        <Text>Loading your deletion request...</Text>
      </Flex>
    );
  }

  if (query.isError) {
    const status = (query.error as AxiosError<DataDeletionApiError>).response
      ?.status;
    return (
      <Flex direction="column" gap="3">
        <Text as="p">
          {status === 404
            ? "We couldn't find a deletion request with that code."
            : "We couldn't load that deletion request right now."}
        </Text>
        <SupportLink />
      </Flex>
    );
  }

  if (!query.data) return null;

  const { data } = query;
  let message: string;
  switch (data.status) {
    case 'COMPLETED':
      message = data.dataFound
        ? 'Your Instagram data has been deleted from MisoAuto.'
        : 'MisoAuto had no Instagram data stored for this account, so nothing needed to be deleted.';
      break;
    case 'PENDING':
      message = 'Your request is being processed.';
      break;
    case 'FAILED':
      message = `We couldn't complete this request automatically. We've been notified; contact ${SUPPORT_EMAIL} with this code.`;
      break;
  }

  return (
    <Flex direction="column" gap="5">
      <Text as="p" size="4">
        {message}
      </Text>
      <Box>
        <Text as="p" weight="bold" mb="2">
          Request details
        </Text>
        <Flex direction="column" gap="2">
          <Text as="p">
            Confirmation code: <strong>{data.confirmationCode}</strong>
          </Text>
          <Text as="p">Platform: Instagram</Text>
          <Text as="p">Requested: {formatDate(data.requestedAt)}</Text>
          <Text as="p">Completed: {formatDate(data.completedAt)}</Text>
        </Flex>
      </Box>
    </Flex>
  );
}

export default function DataDeletionPage() {
  return (
    <Flex direction="column" minHeight="100vh">
      <Box p="6" flexGrow="1" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Flex direction="column" gap="5">
          <Heading size="8">Instagram Data Deletion</Heading>
          <Suspense
            fallback={
              <Flex align="center" gap="2">
                <Spinner />
                <Text>Loading your deletion request...</Text>
              </Flex>
            }
          >
            <DataDeletionContent />
          </Suspense>
        </Flex>
      </Box>
      <Footer />
    </Flex>
  );
}
