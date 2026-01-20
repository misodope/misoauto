'use client';

import { Button, Text, Flex } from '@radix-ui/themes';
import { useAuth } from '../../contexts/AuthContext';

export default function DevAuthHelper() {
  const { isLoggedIn, logout } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Flex
      align="center"
      gap="2"
      style={{
        backgroundColor: 'var(--color-panel-solid)',
        border: '2px solid var(--accent-8)',
        borderRadius: '8px',
        padding: '6px 12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        marginRight: '8px',
        height: '36px',
        minWidth: 'auto',
      }}
    >
      <Text size="1" weight="bold" color="orange">
        DEV
      </Text>
      <Text size="1" color="gray">
        {isLoggedIn ? '✅' : '❌'}
      </Text>
      {isLoggedIn && (
        <Button
          size="1"
          variant="soft"
          color="red"
          onClick={logout}
          style={{ height: '24px', fontSize: '11px' }}
        >
          Logout
        </Button>
      )}
    </Flex>
  );
}
