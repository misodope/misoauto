'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
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
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toaster';
import {
  useDisconnectSocialAccount,
  useInstagramIntegration,
  useTikTokIntegration,
  useYouTubeIntegration,
} from '@frontend/app/hooks/apis/integrations/use-integrations';
import { SocialAccount, useAuth } from '@frontend/app/contexts/AuthContext';

interface Integration {
  platform: Platform;
}

enum Platform {
  TIKTOK = 'TikTok',
  YOUTUBE = 'YouTube',
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
}

const INTEGRATIONS: Integration[] = [
  { platform: Platform.TIKTOK },
  { platform: Platform.INSTAGRAM },
  { platform: Platform.YOUTUBE },
  { platform: Platform.FACEBOOK },
];

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  const toastShownRef = useRef(false);
  const { user, refreshUser } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(
    null,
  );

  const { mutate: connectTikTok } = useTikTokIntegration();
  const { mutate: connectYouTube } = useYouTubeIntegration();
  const { mutate: connectInstagram } = useInstagramIntegration();
  const { mutateAsync: disconnectSocialAccount, isPending: isDisconnecting } =
    useDisconnectSocialAccount();

  useEffect(() => {
    if (toastShownRef.current) return;

    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');

    if (errorParam) {
      error('Connection failed', 'Please try again.');
      toastShownRef.current = true;
    } else if (
      successParam === 'tiktok_connected' ||
      successParam === 'youtube_connected' ||
      successParam === 'instagram_connected'
    ) {
      const platform = successParam.replace('_connected', '');
      success(
        `${platform.charAt(0).toUpperCase()}${platform.slice(1)} connected`,
        'Your account was linked successfully.',
      );
      void refreshUser();
      toastShownRef.current = true;
    }

    if (errorParam || successParam) {
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, success, error, refreshUser]);

  const isSupported = (platform: Platform): boolean => {
    return (
      platform === Platform.TIKTOK ||
      platform === Platform.YOUTUBE ||
      platform === Platform.INSTAGRAM
    );
  };

  const getConnectedAccount = (platform: Platform): SocialAccount | null => {
    return (
      user?.socialAccounts?.find(
        (account) =>
          account.platform.name.toLowerCase() === platform.toLowerCase(),
      ) ?? null
    );
  };

  const handleConnect = (platform: Platform) => {
    switch (platform) {
      case Platform.TIKTOK:
        connectTikTok();
        break;
      case Platform.YOUTUBE:
        connectYouTube();
        break;
      case Platform.INSTAGRAM:
        connectInstagram();
        break;
      default:
        break;
    }
  };

  const confirmDisconnect = async () => {
    if (!selectedAccount) return;

    try {
      await disconnectSocialAccount(selectedAccount.id);
      await refreshUser();
      success(
        `${selectedAccount.platform.displayName} disconnected`,
        'Stored credentials were cleared and future posts were stopped.',
      );
      setSelectedAccount(null);
    } catch (requestError) {
      const responseMessage = (
        requestError as {
          response?: { data?: { message?: string | string[] } };
        }
      ).response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : responseMessage || 'Please try again.';
      error('Disconnect failed', message);
    }
  };

  return (
    <Box p="6">
      <Heading size="7" mb="6">
        Platform Integrations
      </Heading>
      <Grid columns="2" gap="4">
        {INTEGRATIONS.map((integration) => {
          const account = getConnectedAccount(integration.platform);
          const isConnected = account !== null;
          const isThisAccountDisconnecting =
            isDisconnecting && selectedAccount?.id === account?.id;

          return (
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
                  {isConnected && (
                    <Badge color="green" size="1">
                      Connected
                    </Badge>
                  )}
                </Flex>
                {account && (
                  <Text size="2" color="gray">
                    {account.username}
                  </Text>
                )}
                <Button
                  onClick={() =>
                    account
                      ? setSelectedAccount(account)
                      : handleConnect(integration.platform)
                  }
                  variant={isConnected ? 'outline' : 'solid'}
                  size="3"
                  disabled={
                    !isSupported(integration.platform) || isDisconnecting
                  }
                >
                  {isThisAccountDisconnecting
                    ? 'Disconnecting…'
                    : isConnected
                      ? 'Disconnect'
                      : 'Connect'}
                </Button>
              </Flex>
            </Card>
          );
        })}
      </Grid>

      <Modal
        isOpen={selectedAccount !== null}
        title="Disconnect account"
        onOpenChange={(open) => {
          if (!open && !isDisconnecting) setSelectedAccount(null);
        }}
        onConfirm={() => void confirmDisconnect()}
        confirmLabel="Disconnect"
        confirmColor="red"
        confirmLoading={isDisconnecting}
        confirmDisabled={!selectedAccount}
      >
        <Text>
          Disconnect {selectedAccount?.platform.displayName} account{' '}
          <strong>{selectedAccount?.username}</strong>? Stored credentials will
          be cleared and scheduled posts for this account will be cancelled.
          Historical post records will remain available.
        </Text>
      </Modal>
    </Box>
  );
}

export default function Integrations() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <Box p="6">
            <Text>Loading...</Text>
          </Box>
        }
      >
        <IntegrationsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
