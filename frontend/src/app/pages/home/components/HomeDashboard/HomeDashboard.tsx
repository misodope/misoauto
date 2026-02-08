'use client';

import { Flex, Heading, Text, Grid, Box } from '@radix-ui/themes';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardCard from '../../../../components/DashboardCard';

export default function HomeDashboard() {
  const { user } = useAuth();

  return (
    <Flex direction="column" gap="6">
      <Box>
        <Heading size="7" mb="2">
          Hey{user?.name ? `, ${user.name}` : ''}!
        </Heading>
        <Text size="3" color="gray">
          Manage your social media content uploads and integrations.
        </Text>
      </Box>

      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
        <DashboardCard
          title="Videos"
          description="Manage and upload your video content"
          actionLabel="View Videos"
          actionHref="/videos"
        />
        <DashboardCard
          title="Integrations"
          description="Connect your social media accounts"
          actionLabel="Manage Integrations"
          actionHref="/integrations"
        />
        <DashboardCard
          title="Upload"
          description="Upload new content to your platforms"
          actionLabel="Upload Video"
          actionHref="/videos/upload"
        />
      </Grid>
    </Flex>
  );
}
