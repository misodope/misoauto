export interface TikTokUserInfo {
  avatar_url: string;
  bio_description: string;
  display_name: string;
  follower_count: number;
  following_count: number;
  likes_count: number;
  profile_deep_link: string;
}

export interface TikTokSuccessResponse {
  data: {
    user: TikTokUserInfo;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export class TikTokController {
  // Fetch user info from TikTok API
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      const url =
        "https://open.tiktokapis.com/v2/user/info/?fields=avatar_url,bio_description,display_name,follower_count,following_count,likes_count,profile_deep_link";
      const fetchConfig: RequestInit = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };
      const response = await fetch(url, fetchConfig);
      if (!response.ok) {
        throw new Error(
          `Network response was not ok:  ${response?.statusText}`
        );
      }

      const responseData: TikTokSuccessResponse = await response.json();
      console.log("responseData", responseData);
      return responseData.data.user;
    } catch (error: unknown) {
      console.error(error);
    }
  }
}
