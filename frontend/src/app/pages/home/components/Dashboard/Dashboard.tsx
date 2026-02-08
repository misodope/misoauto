import DashboardCard from '@frontend/app/components/DashboardCard';
import { useTikTokUserInfo } from '@frontend/app/hooks/apis/integrations/use-integrations';
import { Avatar, Grid } from '@radix-ui/themes';

export const Dashboard = () => {
  const {
    data: tiktokUserInfo,
    isLoading: isTikTokUserInfoLoading,
    error: tiktokUserInfoError,
  } = useTikTokUserInfo();

  console.log('TikTok User Info:', {
    data: tiktokUserInfo,
    isLoading: isTikTokUserInfoLoading,
    error: tiktokUserInfoError,
  });

  const hasTikTokIntegration = Boolean(tiktokUserInfo?.user.open_id);

  return (
    <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
      {hasTikTokIntegration && (
        <DashboardCard
          title="TikTok Account"
          description={`Connected as ${tiktokUserInfo?.user.display_name || 'Unknown User'}`}
          actionLabel="View TikTok Profile"
        >
          <Avatar
            src={tiktokUserInfo?.user.avatar_url_100}
            fallback={tiktokUserInfo?.user.display_name || 'U'}
          />
        </DashboardCard>
      )}
    </Grid>
  );
};
