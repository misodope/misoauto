import Loader from "../../components/Loader/Loader";
import { useAuthContext } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import {
  TikTokVideo,
  TikTokVideoListResponse,
} from "../../../../services/api/TikTokController";

export const Videos = () => {
  const { authData } = useAuthContext();
  const [videos, setVideos] = useState<Array<TikTokVideo>>([]);
  const [hoveredVideo, setHoveredVideo] = useState<TikTokVideo | null>(null);

  const handleMouseEnter = (video: TikTokVideo) => {
    setHoveredVideo(video);
  };

  const handleMouseLeave = () => {
    setHoveredVideo(null);
  };

  useEffect(() => {
    const fetchVideoList = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/tiktok/videos`;
        const fetchConfig: RequestInit = {
          method: "POST",
          body: JSON.stringify({ accessToken: authData?.accessToken }),
          headers: {
            "Content-Type": "application/json",
          },
        };

        const response = await fetch(url, fetchConfig);

        if (!response.ok) {
          throw new Error(
            `Network response was not ok:  ${response?.statusText}`,
          );
        }

        const responseData: TikTokVideoListResponse = await response.json();

        setVideos(responseData.data.videos);
      } catch (error: unknown) {
        console.error(error);
      }
    };

    if (authData) {
      fetchVideoList();
    }
  }, [authData]);

  if (!videos.length) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-10">Videos</h1>
      <div className="grid grid-cols-3 gap-4">
        {videos.map((video) => (
          <div key={video.id} className="max-h-80">
            <a
              href={video.share_url}
              onMouseEnter={() => handleMouseEnter(video)}
              onMouseLeave={handleMouseLeave}
            >
              <img
                className="max-w-[12rem] h-80 rounded mb-4"
                src={video.cover_image_url}
                alt="Video"
              />
              {hoveredVideo?.id === video.id && (
                <div className="h-80 max-w-[12rem] relative bottom-[336px] bg-gray-100 p-2 text-sm text-center opacity-75 transition-opacity overflow-ellipsis">
                  {video.title}
                </div>
              )}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Videos;
