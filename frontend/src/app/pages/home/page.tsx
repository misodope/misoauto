'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Text } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';
import HomeDashboard from './components/HomeDashboard';
import { Dashboard } from './components/Dashboard/Dashboard';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minHeight="100vh"
        p="8"
        style={{ textAlign: 'center' }}
      >
        <Text size="4" color="gray">
          Loading...
        </Text>
      </Flex>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Flex direction="column" gap="6">
      <HomeDashboard />
      <Dashboard />
    </Flex>
  );
}
