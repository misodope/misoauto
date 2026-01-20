'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Flex, Heading, Text, Button, Box, Card, Badge } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();

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
        <Text size="4" color="gray">Loading...</Text>
      </Flex>
    );
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
      <Heading size="8" mb="4">Welcome to MisoAuto</Heading>
      <Text size="5" color="gray" mb="8">
        Your social media automation platform
      </Text>

      {isLoggedIn ? (

        <Card size="3" style={{ maxWidth: '500px', width: '100%' }}>
          <Flex direction="column" align="center" gap="4">
            <Flex align="center" gap="2">
              <Badge color="green" size="2">✓ Logged in</Badge>
            </Flex>

            <Text size="4" weight="medium">
              Welcome back!
            </Text>

            <Text size="3" color="gray" style={{ textAlign: 'center' }}>
              You're all set to manage your social media content and automations.
            </Text>

            <Flex gap="3" mt="4">
              <Button asChild size="3">
                <Link href="/videos">View Videos</Link>
              </Button>
              <Button asChild variant="outline" size="3">
                <Link href="/integrations">Integrations</Link>
              </Button>
            </Flex>
          </Flex>
        </Card>
      ) : (

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
      )}
    </Flex>
  );
}