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

  const connectAction = {
    actionHref: '/integrations',
    actionLabel: 'Connect',
  };

  return (
    <Flex direction="column" gap="4">
      <Heading size="5">Platform Connections</Heading>
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
        <DashboardCard
          title="TikTok Account"
          description={
            tiktokAccount
              ? `Connected as ${tiktokUserInfo?.user.display_name || tiktokAccount.username}`
              : 'Not connected'
          }
          muted={!tiktokAccount}
          compact
          {...(!tiktokAccount ? connectAction : {})}
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
          {...(!instagramAccount ? connectAction : {})}
        >
          {instagramAccount && (
            <Avatar
              size="2"
              src={instagramUserInfo?.user.profile_picture_url}
              fallback={
                instagramUserInfo?.user.username || instagramAccount.username
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
          {...(!youtubeAccount ? connectAction : {})}
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
          {...(!facebookAccount ? connectAction : {})}
        >
          {facebookAccount && (
            <Avatar fallback={facebookAccount.username || 'F'} />
          )}
        </DashboardCard>
      </Grid>
    </Flex>
  );
};
