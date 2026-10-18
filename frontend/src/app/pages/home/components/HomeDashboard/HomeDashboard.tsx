'use client';

import { Box, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  useTikTokUserInfo,
  useYouTubeUserInfo,
} from '../../../../hooks/apis/integrations/use-integrations';

const formatMetric = (value?: number | string) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value));
};

export default function HomeDashboard() {
  const { user } = useAuth();
  const socialAccounts = user?.socialAccounts ?? [];
  const hasTikTokAccount = socialAccounts.some(
    (account) => account.platform.name.toUpperCase() === 'TIKTOK',
  );
  const hasYouTubeAccount = socialAccounts.some(
    (account) => account.platform.name.toUpperCase() === 'YOUTUBE',
  );

  const { data: tiktokUserInfo } = useTikTokUserInfo(hasTikTokAccount);
  const { data: youtubeUserInfo } = useYouTubeUserInfo(hasYouTubeAccount);

  const tiktokFollowers = tiktokUserInfo?.user.follower_count;
  const youtubeSubscribers =
    youtubeUserInfo?.channel.statistics.subscriberCount;
  const audienceValues = [tiktokFollowers, youtubeSubscribers]
    .filter((value) => value !== undefined)
    .map(Number);
  const totalAudience = audienceValues.length
    ? audienceValues.reduce((total, value) => total + value, 0)
    : undefined;

  const metrics = [
    {
      label: 'Connected Platforms',
      value: formatMetric(socialAccounts.length),
      description: 'Accounts linked',
    },
    {
      label: 'Total Audience',
      value: formatMetric(totalAudience),
      description: 'TikTok + YouTube',
    },
    {
      label: 'TikTok Followers',
      value: formatMetric(tiktokFollowers),
      description: 'Current followers',
    },
    {
      label: 'YouTube Subscribers',
      value: formatMetric(youtubeSubscribers),
      description: 'Current subscribers',
    },
  ];

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

      <Grid columns={{ initial: '2', sm: '4' }} gap="3">
        {metrics.map((metric) => (
          <Card key={metric.label} size="2">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                {metric.label}
              </Text>
              <Text size="6" weight="bold">
                {metric.value}
              </Text>
              <Text size="1" color="gray">
                {metric.description}
              </Text>
            </Flex>
          </Card>
        ))}
      </Grid>
    </Flex>
  );
}
