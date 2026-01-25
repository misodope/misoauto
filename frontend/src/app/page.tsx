'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Heading, Text, Button, Box } from '@radix-ui/themes';
import { useAuth } from './contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push('/home');
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

  if (isLoggedIn) {
    return null;
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="100vh"
      p="8"
      style={{ textAlign: 'center' }}
    >
      <Heading size="8" mb="4">
        Welcome to MisoAuto
      </Heading>
      <Text size="5" color="gray" mb="8">
        Your social media automation platform
      </Text>

      <Box>
        <Text size="4" color="gray" mb="6" style={{ display: 'block' }}>
          Get started by creating an account or logging in
        </Text>

        <Flex gap="4" justify="center">
          <Button asChild size="4" variant="solid">
            <Link href="/auth/register">Sign Up</Link>
          </Button>
          <Button asChild size="4" variant="outline">
            <Link href="/auth/login">Log In</Link>
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
