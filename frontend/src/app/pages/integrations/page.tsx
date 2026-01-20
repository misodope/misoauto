'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Flex,
  Heading,
  Button,
  Card,
  Text,
  Badge,
  Grid,
} from '@radix-ui/themes';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { useToast } from '../../components/Toaster';
import { useTikTokIntegration } from '@frontend/app/hooks/apis/integrations/use-integrations';
import { useAuth } from '@frontend/app/contexts/AuthContext';

interface Integration {
  platform: Platform;
  connected: boolean;
  lastSync?: string;
}

enum Platform {
  TIKTOK = 'TikTok',
  YOUTUBE = 'YouTube',
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
}

export default function Integrations() {
  const searchParams = useSearchParams();

  const { success, error } = useToast();
  const toastShownRef = useRef(false);

  const { user } = useAuth();

  const [integrations, setIntegrations] = useState<Integration[]>([
    { platform: Platform.TIKTOK, connected: false },
    { platform: Platform.INSTAGRAM, connected: false },
    { platform: Platform.YOUTUBE, connected: false },
    { platform: Platform.FACEBOOK, connected: false },
  ]);

  const { mutate: connectTikTok } = useTikTokIntegration();

  // Handle OAuth callback results from URL params
  useEffect(() => {
    if (toastShownRef.current) return;

    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');

    if (errorParam) {
      error('Connection failed', 'Please try again.');
      toastShownRef.current = true;
    } else if (successParam === 'tiktok_connected') {
      success('TikTok connected', 'Your account was linked successfully.');
      setIntegrations((prev) =>
        prev.map((i) =>
          i.platform === Platform.TIKTOK ? { ...i, connected: true } : i,
        ),
      );
      toastShownRef.current = true;
    }

    // Clear URL params after reading
    if (errorParam || successParam) {
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, success, error]);

  useEffect(() => {
    if (!user) return;
    const activePlatforms =
      user.socialAccounts?.flatMap((account) =>
        Object.values(Platform).some(
          (p) => p.toLowerCase() === account.platform.name.toLowerCase(),
        )
          ? account.platform.name
          : [],
      ) || [];

    setIntegrations((prev) =>
      prev.map((i) => {
        const isConnected = activePlatforms.some(
          (p) => p.toLowerCase() === i.platform.toLowerCase(),
        );

        return { ...i, connected: isConnected };
      }),
    );
  }, [user]);

  const isSupported = (platform: Platform): boolean => {
    return platform === Platform.TIKTOK;
  };

  const isConnected = (platform: Platform): boolean => {
    return integrations.some((i) => i.platform === platform && i.connected);
  };

  const handleConnect = (platform: Platform) => {
    switch (platform) {
      case Platform.TIKTOK:
        connectTikTok();
        break;
      default:
        console.log('Unsupported Integration');
    }
  };

  const handleDisconnect = () => {
    console.log('Implement Disconnect');
  };

  return (
    <ProtectedRoute>
      <Box p="6">
        <Heading size="7" mb="6">
          Platform Integrations
        </Heading>
        <Grid columns="2" gap="4">
          {integrations.map((integration) => (
            <Card
              key={integration.platform}
              size="3"
              style={{ padding: '24px' }}
            >
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center" gap="2">
                  <Heading size="5">{integration.platform}</Heading>
                  {!isSupported(integration.platform) && (
                    <Badge color="gray" size="1">
                      Coming Soon
                    </Badge>
                  )}
                  {isConnected(integration.platform) && (
                    <Badge color="green" size="1">
                      Connected
                    </Badge>
                  )}
                </Flex>
                <Button
                  onClick={() =>
                    integration.connected
                      ? handleDisconnect()
                      : handleConnect(integration.platform)
                  }
                  variant={integration.connected ? 'outline' : 'solid'}
                  size="3"
                  disabled={!isSupported(integration.platform)}
                >
                  {integration.connected ? 'Disconnect' : 'Connect'}
                </Button>
                {integration.lastSync && (
                  <Text size="2" color="gray">
                    Last synced: {integration.lastSync}
                  </Text>
                )}
              </Flex>
            </Card>
          ))}
        </Grid>
      </Box>
    </ProtectedRoute>
  );
}
