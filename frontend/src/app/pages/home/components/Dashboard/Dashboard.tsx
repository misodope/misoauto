import DashboardCard from '@frontend/app/components/DashboardCard';
import { useAuth } from '@frontend/app/contexts/AuthContext';
import { useVideoPosts } from '@frontend/app/hooks/apis/video-posts/use-video-posts';
import {
  useInstagramUserInfo,
  useTikTokUserInfo,
  useYouTubeUserInfo,
} from '@frontend/app/hooks/apis/integrations/use-integrations';
import { Avatar, Flex, Grid, Heading, Skeleton, Text } from '@radix-ui/themes';

type PlatformMetric = {
  label: string;
  connected: boolean;
  value?: number;
  isLoading: boolean;
  isError: boolean;
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatMetric = (value?: number) =>
  value === undefined ? '—' : numberFormatter.format(value);

const getMetricValue = (metrics: PlatformMetric[]) => {
  const values = metrics
    .map((metric) => metric.value)
    .filter((value): value is number => value !== undefined);

  return values.length
    ? values.reduce((total, value) => total + value, 0)
    : undefined;
};

const getMetricDisplayValue = (metric: PlatformMetric) => {
  if (!metric.connected) return 'Not connected';
  if (metric.isLoading) return 'Loading…';
  if (metric.isError) return 'Unavailable';
  return formatMetric(metric.value);
};

function MetricBreakdown({ metrics }: { metrics: PlatformMetric[] }) {
  return (
    <Flex direction="column" gap="2">
      {metrics.map((metric) => {
        const isMetricLoading = metric.connected && metric.isLoading;

        return (
          <Flex key={metric.label} justify="between" align="center">
            <Text size="2" color="gray">
              {metric.label}
            </Text>
            <Skeleton loading={isMetricLoading}>
              <Text size="2" color={metric.connected ? undefined : 'gray'}>
                {getMetricDisplayValue(metric)}
              </Text>
            </Skeleton>
          </Flex>
        );
      })}
    </Flex>
  );
}

function MetricCard({
  title,
  metrics,
}: {
  title: string;
  metrics: PlatformMetric[];
}) {
  const isLoading = metrics.some(
    (metric) => metric.connected && metric.isLoading,
  );

  return (
    <DashboardCard title={title} cardSize="2">
      <Skeleton loading={isLoading}>
        <Text size="6" weight="bold" mb="1">
          {formatMetric(getMetricValue(metrics))}
        </Text>
      </Skeleton>
      <MetricBreakdown metrics={metrics} />
    </DashboardCard>
  );
}

export const Dashboard = () => {
  const { user } = useAuth();
  const socialAccounts = user?.socialAccounts ?? [];
  const getConnectedAccount = (platform: string) =>
    socialAccounts.find(
      (account) => account.platform.name.toUpperCase() === platform,
    );

  const tiktokAccount = getConnectedAccount('TIKTOK');
  const instagramAccount = getConnectedAccount('INSTAGRAM');
  const youtubeAccount = getConnectedAccount('YOUTUBE');
  const facebookAccount = getConnectedAccount('FACEBOOK');

  const {
    data: tiktokUserInfo,
    isLoading: isTikTokUserInfoLoading,
    isError: isTikTokUserInfoError,
  } = useTikTokUserInfo(Boolean(tiktokAccount));
  const {
    data: instagramUserInfo,
    isLoading: isInstagramUserInfoLoading,
    isError: isInstagramUserInfoError,
  } = useInstagramUserInfo(Boolean(instagramAccount));
  const {
    data: youtubeUserInfo,
    isLoading: isYouTubeUserInfoLoading,
    isError: isYouTubeUserInfoError,
  } = useYouTubeUserInfo(Boolean(youtubeAccount));
  const {
    data: videoPosts,
    isLoading: isVideoPostsLoading,
    isError: isVideoPostsError,
  } = useVideoPosts();

  const audienceMetrics: PlatformMetric[] = [
    {
      label: 'TikTok',
      connected: Boolean(tiktokAccount),
      value: tiktokUserInfo?.user.follower_count,
      isLoading: isTikTokUserInfoLoading,
      isError: isTikTokUserInfoError,
    },
    {
      label: 'Instagram',
      connected: Boolean(instagramAccount),
      value: instagramUserInfo?.user.followers_count,
      isLoading: isInstagramUserInfoLoading,
      isError: isInstagramUserInfoError,
    },
    {
      label: 'YouTube',
      connected: Boolean(youtubeAccount),
      value: youtubeUserInfo
        ? Number(youtubeUserInfo.channel.statistics.subscriberCount)
        : undefined,
      isLoading: isYouTubeUserInfoLoading,
      isError: isYouTubeUserInfoError,
    },
  ];

  const uploadMetrics: PlatformMetric[] = [
    {
      label: 'TikTok',
      connected: Boolean(tiktokAccount),
      value: tiktokUserInfo?.user.video_count,
      isLoading: isTikTokUserInfoLoading,
      isError: isTikTokUserInfoError,
    },
    {
      label: 'Instagram',
      connected: Boolean(instagramAccount),
      value: instagramUserInfo?.user.media_count,
      isLoading: isInstagramUserInfoLoading,
      isError: isInstagramUserInfoError,
    },
    {
      label: 'YouTube',
      connected: Boolean(youtubeAccount),
      value: youtubeUserInfo
        ? Number(youtubeUserInfo.channel.statistics.videoCount)
        : undefined,
      isLoading: isYouTubeUserInfoLoading,
      isError: isYouTubeUserInfoError,
    },
  ];

  const publishedPostCounts = (videoPosts ?? []).reduce<Record<string, number>>(
    (counts, post) => {
      if (post.status !== 'PUBLISHED') return counts;

      const platform = post.platform.name.toUpperCase();
      counts[platform] = (counts[platform] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const publishedPostMetrics: PlatformMetric[] = [
    {
      label: 'TikTok',
      connected: Boolean(tiktokAccount),
      value: videoPosts ? (publishedPostCounts.TIKTOK ?? 0) : undefined,
      isLoading: isVideoPostsLoading,
      isError: isVideoPostsError,
    },
    {
      label: 'Instagram',
      connected: Boolean(instagramAccount),
      value: videoPosts ? (publishedPostCounts.INSTAGRAM ?? 0) : undefined,
      isLoading: isVideoPostsLoading,
      isError: isVideoPostsError,
    },
    {
      label: 'YouTube',
      connected: Boolean(youtubeAccount),
      value: videoPosts ? (publishedPostCounts.YOUTUBE ?? 0) : undefined,
      isLoading: isVideoPostsLoading,
      isError: isVideoPostsError,
    },
  ];

  return (
    <Flex direction="column" gap="4">
      <Grid columns={{ initial: '1', sm: '3' }} gap="3">
        <MetricCard title="Total Audience" metrics={audienceMetrics} />
        <MetricCard title="Total Uploads" metrics={uploadMetrics} />
        <MetricCard title="Published Posts" metrics={publishedPostMetrics} />
      </Grid>

      <Grid columns={{ initial: '1', md: '2' }} gap="6" align="start">
        <Flex direction="column" gap="4" style={{ order: 2 }}>
          <Heading size="5">Platform Connections</Heading>
          <Grid columns="1" gap="2" style={{ width: '100%' }}>
            <DashboardCard
              title="TikTok Account"
              description={
                <Skeleton
                  loading={Boolean(tiktokAccount) && isTikTokUserInfoLoading}
                >
                  {tiktokAccount
                    ? `Connected as ${tiktokUserInfo?.user.display_name || tiktokAccount.username}`
                    : 'Not connected'}
                </Skeleton>
              }
              muted={!tiktokAccount}
              compact
            >
              {tiktokAccount && (
                <Skeleton loading={isTikTokUserInfoLoading}>
                  <Avatar
                    size="2"
                    src={tiktokUserInfo?.user.avatar_url_100}
                    fallback={
                      tiktokUserInfo?.user.display_name ||
                      tiktokAccount.username
                    }
                  />
                </Skeleton>
              )}
            </DashboardCard>

            <DashboardCard
              title="Instagram Account"
              description={
                <Skeleton
                  loading={
                    Boolean(instagramAccount) && isInstagramUserInfoLoading
                  }
                >
                  {instagramAccount
                    ? `Connected as @${instagramUserInfo?.user.username || instagramAccount.username}`
                    : 'Not connected'}
                </Skeleton>
              }
              muted={!instagramAccount}
              compact
            >
              {instagramAccount && (
                <Skeleton loading={isInstagramUserInfoLoading}>
                  <Avatar
                    size="2"
                    src={instagramUserInfo?.user.profile_picture_url}
                    fallback={
                      instagramUserInfo?.user.username ||
                      instagramAccount.username
                    }
                  />
                </Skeleton>
              )}
            </DashboardCard>

            <DashboardCard
              title="YouTube Account"
              description={
                <Skeleton
                  loading={Boolean(youtubeAccount) && isYouTubeUserInfoLoading}
                >
                  {youtubeAccount
                    ? `Connected as ${youtubeUserInfo?.channel.snippet.title || youtubeAccount.username}`
                    : 'Not connected'}
                </Skeleton>
              }
              muted={!youtubeAccount}
              compact
            >
              {youtubeAccount && (
                <Skeleton loading={isYouTubeUserInfoLoading}>
                  <Avatar
                    size="2"
                    src={
                      youtubeUserInfo?.channel.snippet.thumbnails.default.url
                    }
                    fallback={
                      youtubeUserInfo?.channel.snippet.title ||
                      youtubeAccount.username
                    }
                  />
                </Skeleton>
              )}
            </DashboardCard>

            <DashboardCard
              title="Facebook Account"
              description={
                facebookAccount
                  ? `Connected as ${facebookAccount.username}`
                  : 'Not connected'
              }
              muted={!facebookAccount}
              compact
            >
              {facebookAccount && (
                <Avatar fallback={facebookAccount.username || 'F'} />
              )}
            </DashboardCard>
          </Grid>
        </Flex>

        <Flex direction="column" gap="4" style={{ order: 1 }}>
          <Heading size="5">Quick Actions</Heading>
          <Grid columns="1" gap="3">
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
              actionHref="/videos"
            />
          </Grid>
        </Flex>
      </Grid>
    </Flex>
  );
};
