'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Button, Card, Text, Badge, Grid } from '@radix-ui/themes';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';

interface Integration {
  platform: string;
  connected: boolean;
  lastSync?: string;
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { platform: 'TikTok', connected: false },
    { platform: 'YouTube', connected: false },
    { platform: 'Instagram', connected: false },
    { platform: 'Facebook', connected: false },
  ]);

  useEffect(() => {
    console.log('Integrations page mounted');
  }, []);

  const handleConnect = (platform: string) => {
    console.log(`Connecting to ${platform}`);
  };

  return (
    <ProtectedRoute>
      <Box p="6">
        <Heading size="7" mb="6">Platform Integrations</Heading>
        <Grid columns="2" gap="4">
          {integrations.map((integration) => (
            <Card key={integration.platform} size="3" style={{ padding: '24px' }}>
              <Flex direction="column" gap="4">
                <Heading size="5">{integration.platform}</Heading>
                <Badge
                  color={integration.connected ? 'green' : 'red'}
                  size="2"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {integration.connected ? 'Connected' : 'Not Connected'}
                </Badge>
                <Button
                  onClick={() => handleConnect(integration.platform)}
                  variant={integration.connected ? 'outline' : 'solid'}
                  size="3"
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