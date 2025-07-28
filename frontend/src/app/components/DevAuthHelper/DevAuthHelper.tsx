'use client';

import { Button, Box, Text, Flex } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';

export default function DevAuthHelper() {
  const { isLoggedIn, impersonateLogin, logout } = useAuth();

  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom="4"
      right="4"
      style={{
        zIndex: 9999,
        backgroundColor: 'var(--color-panel-solid)',
        border: '2px solid var(--accent-8)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <Flex direction="column" gap="2" align="center">
        <Text size="1" weight="bold" color="orange">
          DEV ONLY
        </Text>
        <Text size="2" align="center">
          Auth Status: {isLoggedIn ? '✅ Logged In' : '❌ Logged Out'}
        </Text>
        <Flex gap="2">
          {!isLoggedIn ? (
            <Button
              size="1"
              variant="solid"
              color="green"
              onClick={impersonateLogin}
            >
              🎭 Login as Dev User
            </Button>
          ) : (
            <Button
              size="1"
              variant="soft"
              color="red"
              onClick={logout}
            >
              🚪 Logout
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
