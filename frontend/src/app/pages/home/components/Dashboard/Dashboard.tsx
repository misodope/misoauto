import DashboardCard from '@frontend/app/components/DashboardCard';
import {
  useInstagramUserInfo,
  useTikTokUserInfo,
} from '@frontend/app/hooks/apis/integrations/use-integrations';
import { Avatar, Grid } from '@radix-ui/themes';

export const Dashboard = () => {
  const {
    data: tiktokUserInfo,
    isLoading: isTikTokUserInfoLoading,
    error: tiktokUserInfoError,
  } = useTikTokUserInfo();
  const {
    data: instagramUserInfo,
    isLoading: isInstagramUserInfoLoading,
    error: instagramUserInfoError,
  } = useInstagramUserInfo();

  console.log('TikTok User Info:', {
    data: tiktokUserInfo,
    isLoading: isTikTokUserInfoLoading,
    error: tiktokUserInfoError,
  });
  console.log('Instagram User Info:', {
    data: instagramUserInfo,
    isLoading: isInstagramUserInfoLoading,
    error: instagramUserInfoError,
  });

  const hasTikTokIntegration = Boolean(tiktokUserInfo?.user.open_id);
  const hasInstagramIntegration = Boolean(instagramUserInfo?.user.user_id);

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
      {hasInstagramIntegration && (
        <DashboardCard
          title="Instagram Account"
          description={`Connected as @${instagramUserInfo?.user.username || 'Unknown User'}`}
          actionLabel="View Instagram Profile"
        >
          <Avatar
            src={instagramUserInfo?.user.profile_picture_url}
            fallback={instagramUserInfo?.user.username || 'U'}
          />
        </DashboardCard>
      )}
    </Grid>
  );
};
