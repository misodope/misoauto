import DashboardCard from '@frontend/app/components/DashboardCard';
import { useAuth } from '@frontend/app/contexts/AuthContext';
import {
  useInstagramUserInfo,
  useTikTokUserInfo,
  useYouTubeUserInfo,
} from '@frontend/app/hooks/apis/integrations/use-integrations';
import { Avatar, Flex, Grid, Heading } from '@radix-ui/themes';

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

  const { data: tiktokUserInfo } = useTikTokUserInfo(Boolean(tiktokAccount));
  const { data: instagramUserInfo } = useInstagramUserInfo(
    Boolean(instagramAccount),
  );
  const { data: youtubeUserInfo } = useYouTubeUserInfo(Boolean(youtubeAccount));

  return (
    <Flex direction="column" gap="4">
      <Grid columns={{ initial: '1', md: '2' }} gap="6" align="start">
        <Flex direction="column" gap="4" style={{ order: 2 }}>
          <Heading size="5">Platform Connections</Heading>
          <Grid
            columns="1"
            gap="2"
            style={{ width: '100%', maxWidth: '400px' }}
          >
            <DashboardCard
              title="TikTok Account"
              description={
                tiktokAccount
                  ? `Connected as ${tiktokUserInfo?.user.display_name || tiktokAccount.username}`
                  : 'Not connected'
              }
              muted={!tiktokAccount}
              compact
            >
              {tiktokAccount && (
                <Avatar
                  size="2"
                  src={tiktokUserInfo?.user.avatar_url_100}
                  fallback={
                    tiktokUserInfo?.user.display_name || tiktokAccount.username
                  }
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="Instagram Account"
              description={
                instagramAccount
                  ? `Connected as @${instagramUserInfo?.user.username || instagramAccount.username}`
                  : 'Not connected'
              }
              muted={!instagramAccount}
              compact
            >
              {instagramAccount && (
                <Avatar
                  size="2"
                  src={instagramUserInfo?.user.profile_picture_url}
                  fallback={
                    instagramUserInfo?.user.username ||
                    instagramAccount.username
                  }
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="YouTube Account"
              description={
                youtubeAccount
                  ? `Connected as ${youtubeUserInfo?.channel.snippet.title || youtubeAccount.username}`
                  : 'Not connected'
              }
              muted={!youtubeAccount}
              compact
            >
              {youtubeAccount && (
                <Avatar
                  size="2"
                  src={youtubeUserInfo?.channel.snippet.thumbnails.default.url}
                  fallback={
                    youtubeUserInfo?.channel.snippet.title ||
                    youtubeAccount.username
                  }
                />
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
              actionHref="/videos/upload"
            />
          </Grid>
        </Flex>
      </Grid>
    </Flex>
  );
};
