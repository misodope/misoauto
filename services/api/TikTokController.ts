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

export interface TikTokVideo {
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
  message: string;
  response: {
    data: {
      videos: Array<TikTokVideo>;
      cursor: number;
      has_more: boolean;
    };
    error: TikTokErrorObj;
  };
}

export class TikTokController {
  // Fetch user info from TikTok API
  async getUserInfo(
    accessToken: string,
  ): Promise<TikTokUserInfo | TikTokErrorObj> {
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
          `Network response was not ok:  ${response?.statusText}`,
        );
      }

      const responseData: TikTokSuccessResponse = await response.json();
      return responseData.data.user;
    } catch (error: unknown) {
      return error as TikTokErrorObj;
    }
  }

  async getVideos(
    accessToken: string,
    cursor: number | null = null,
    maxCount: number = 20,
  ): Promise<TikTokVideoListResponse | TikTokErrorObj> {
    try {
      const url =
        "https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count";

      const body: { cursor?: number; max_count?: number } = {
        max_count: maxCount,
      };

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
          `Network response was not ok:  ${response?.statusText}`,
        );
      }

      const responseData: TikTokVideoListResponse = await response.json();

      return responseData;
    } catch (error: unknown) {
      return error as TikTokErrorObj;
    }
  }

  async initUpload(
    accessToken: string,
    fileSize: number,
    chunkSize: number,
    totalChunkCount: number,
  ) {
    const url = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";
    const body = {
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fileSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount,
      },
    };
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    };

    const fetchConfig: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };
    console.log("Fetch Config for TikTok initUpload: ", fetchConfig);
    try {
      const response = await fetch(url, fetchConfig);
      console.log(response);

      if (!response.ok) {
        throw new Error(
          `Network response was not ok:  ${response?.statusText}`,
        );
      }

      const responseData = await response.json();
      console.log("TikTok initUpload response data: ", responseData);

      return responseData;
    } catch (e) {
      console.log("TikTok initUpload error: ", e);
      return e;
    }
  }
}
