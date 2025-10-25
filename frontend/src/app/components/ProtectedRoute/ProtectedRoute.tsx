'use client';

import { ReactNode } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading } = useProtectedRoute();

  if (isLoading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minHeight="100vh"
        p="8"
      >
        <Text size="4" color="gray">Loading...</Text>
      </Flex>
    );
  }

  if (!isLoggedIn) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minHeight="100vh"
        p="8"
      >
        <Text size="4" color="gray">Redirecting to login...</Text>
      </Flex>
    );
  }

  return <>{children}</>;
}