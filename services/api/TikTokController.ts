interface TikTokErrorObj {
  code: string;
  message: string;
  log_id: string;
}

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
  error: TikTokErrorObj;
}

interface TikTokVideo {
  id: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  title: string;
  embed_html: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export interface TikTokVideoListResponse {
  data: {
    videos: Array<TikTokVideo>;
    cursor: number;
    has_more: boolean;
  };
  error: TikTokErrorObj;
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

  async getVideos(
    accessToken: string,
    cursor: number = null,
    maxCount: number = 20
  ): Promise<TikTokVideoListResponse> {
    try {
      const url =
        "https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count";

      const body: { cursor?: number; count?: number } = { count: maxCount };

      if (cursor) {
        body.cursor = cursor;
      }

      const fetchConfig: RequestInit = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      };
      const response = await fetch(url, fetchConfig);
      if (!response.ok) {
        throw new Error(
          `Network response was not ok:  ${response?.statusText}`
        );
      }

      const responseData: TikTokVideoListResponse = await response.json();

      return responseData;
    } catch (error: unknown) {
      console.error(error);
    }
  }
}
