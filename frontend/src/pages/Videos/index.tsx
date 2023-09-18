import Loader from "../../components/Loader/Loader";
import { useAuthContext } from "../../hooks/useAuth";
import {
  TikTokVideo,
  TikTokVideoListResponse,
} from "../../../../services/api/TikTokController";
import { useFetch } from "../../hooks/useFetch";

import { DataTable } from "../../components/DataTable/DataTable";
import videosJson from "../../test/data/videos-mock.json";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

export const Videos = () => {
  const { authData } = useAuthContext();

  const {
    data: videoData,
    error,
    loading,
  } = useFetch({
    url: `/tiktok/videos`,
    method: "POST",
    body: JSON.stringify({ accessToken: authData?.access_token }),
  });

  const videos: Array<TikTokVideo> =
    videoData?.response.data.videos ?? videosJson.videos;
  console.log("Videos", videos);

  if (!videos.length) {
    return <Loader />;
  }

  const columnHelper = createColumnHelper<TikTokVideo>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
        header: "Video ID",
      }),
      columnHelper.accessor("title", {
        cell: (info) => {
          return <p className="truncate max-w-md">{info.getValue()}</p>;
        },
        footer: (info) => info.column.id,
        header: "Title",
      }),
      columnHelper.accessor("share_url", {
        cell: (info) => {
          return (
            <a
              href={info.getValue()}
              target="_blank"
              className="text-indigo-500 underline hover:text-indigo-900"
            >
              Go to video
            </a>
          );
        },
        footer: (info) => info.column.id,
        header: "Video Link",
      }),
    ],
    [],
  );
  return (
    <div className="container mx-auto flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-10">Videos</h1>
      <DataTable<TikTokVideo> columns={columns} data={videos} />
    </div>
  );
};

export default Videos;
