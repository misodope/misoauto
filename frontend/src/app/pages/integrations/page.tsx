'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Flex, Heading, Button, Card, Text, Badge, Grid, Callout } from '@radix-ui/themes';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { useTikTokIntegration } from '@frontend/app/hooks/apis/integrations/use-integrations';

interface Integration {
  platform: Platform;
  connected: boolean;
  lastSync?: string;
}

type IntegrationNotification = {
  type: 'success' | 'error';
  message: string;
} | null;

enum Platform {
  TIKTOK = 'TikTok',
  YOUTUBE = 'YouTube',
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
}

export default function Integrations() {
  const searchParams = useSearchParams();

  
  const [notification, setNotification] = useState<IntegrationNotification>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([
    { platform: Platform.TIKTOK, connected: false },
    { platform: Platform.INSTAGRAM, connected: false},
    { platform: Platform.YOUTUBE, connected: false },
    { platform: Platform.FACEBOOK, connected: false },
  ]);

  const { mutate: connectTikTok } = useTikTokIntegration();

  // Handle OAuth callback results from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const success = searchParams.get('success');

    const getErrorMessage = (error: string): string => {
      switch (error) {
        case 'csrf_mismatch':
          return 'Security validation failed. Please try again.';
        case 'missing_user_id':
          return 'Session expired. Please log in and try again.';
        case 'connection_failed':
          return 'Failed to connect account. Please try again.';
        case 'access_denied':
          return 'You denied access to your account.';
        default:
          return `Connection failed: ${error}`;
      }
    };

    if (error) {
      const message = errorDescription || getErrorMessage(error);
      setNotification({ type: 'error', message });
    } else if (success === 'tiktok_connected') {
      setNotification({ type: 'success', message: 'TikTok account connected successfully!' });
      // Update TikTok integration status
      setIntegrations((prev) =>
        prev.map((i) => (i.platform === 'TikTok' ? { ...i, connected: true } : i))
      );
    }

    // Clear URL params after reading
    if (error || success) {
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams]);

  const isSupported = (platform: Platform): boolean => {
    return platform === Platform.TIKTOK;
  };

  const handleConnect = (platform: Platform) => {
    switch (platform) {
      case Platform.TIKTOK:
        connectTikTok();
        break;
      default:
        console.log('Unsupported Integration');
    }
  }

  const handleDisconnect = () => {
    console.log('Implement Disconnect')
  }

  return (
    <ProtectedRoute>
      <Box p="6">
        <Heading size="7" mb="6">Platform Integrations</Heading>

        {notification && (
          <Callout.Root
            color={notification.type === 'success' ? 'green' : 'red'}
            mb="4"
          >
            <Callout.Text>{notification.message}</Callout.Text>
          </Callout.Root>
        )}

        <Grid columns="2" gap="4">
          {integrations.map((integration) => (
            <Card key={integration.platform} size="3" style={{ padding: '24px' }}>
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center" gap="">
                  <Heading size="5">{integration.platform}</Heading>
                  {!isSupported(integration.platform) && (
                    <Badge color="gray" size="1">Coming Soon</Badge>
                  )}
                </Flex>
                <Button
                  onClick={() =>
                    integration.connected
                      ? handleDisconnect
                      : handleConnect(integration.platform)
                  }
                  variant={integration.connected ? 'outline' : 'solid'}
                  size="3"
                  disabled={!isSupported(integration.platform)}
                >
                  {integration.connected ? 'Disconnect' : 'Connect'}
                </Button>
                {integration.lastSync && (
                  <Text size="2" color="gray">Last synced: {integration.lastSync}</Text>
                )}
              </Flex>
            </Card>
          ))}
        </Grid>
      </Box>
    </ProtectedRoute>
  );
}