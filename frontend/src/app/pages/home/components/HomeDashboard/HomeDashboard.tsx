'use client';

import Link from 'next/link';
import { Flex, Heading, Text, Button, Card, Grid, Box } from '@radix-ui/themes';
import { useAuth } from '../../../../contexts/AuthContext';

export default function HomeDashboard() {
  const { user } = useAuth();

  return (
    <Flex direction="column" p="6" gap="6" style={{ maxWidth: 1200 }}>
      <Box>
        <Heading size="7" mb="2">
          Hey{user?.name ? `, ${user.name}` : ''}!
        </Heading>
        <Text size="3" color="gray">
          Manage your social media content uploads and integrations.
        </Text>
      </Box>

      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
        <Card size="3">
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              Videos
            </Text>
            <Text size="2" color="gray">
              Manage and upload your video content
            </Text>
            <Button asChild variant="soft" mt="2">
              <Link href="/videos">View Videos</Link>
            </Button>
          </Flex>
        </Card>

        <Card size="3">
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              Integrations
            </Text>
            <Text size="2" color="gray">
              Connect your social media accounts
            </Text>
            <Button asChild variant="soft" mt="2">
              <Link href="/integrations">Manage Integrations</Link>
            </Button>
          </Flex>
        </Card>

        <Card size="3">
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              Upload
            </Text>
            <Text size="2" color="gray">
              Upload new content to your platforms
            </Text>
            <Button asChild variant="soft" mt="2">
              <Link href="/videos/upload">Upload Video</Link>
            </Button>
          </Flex>
        </Card>
      </Grid>
    </Flex>
  );
}
