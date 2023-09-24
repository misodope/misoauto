import Loader from "../../components/Loader/Loader";
import { useAuthContext } from "../../hooks/useAuth";
import { TikTokVideo } from "../../../../services/api/TikTokController";
import { useFetch } from "../../hooks/useFetch";

import { DataTable } from "../../components/DataTable/DataTable";
import videosJson from "../../test/data/videos-mock.json";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { PageContainer } from "../../components/PageContainer/PageContainer";

export const Videos = () => {
  const { authData } = useAuthContext();

  const { data: videoData, loading } = useFetch({
    url: `/tiktok/videos`,
    method: "POST",
    body: JSON.stringify({ accessToken: authData?.access_token }),
  });

  const videos: Array<TikTokVideo> =
    videoData?.data.videos ?? videosJson.videos;
  console.log("Videos", videos);

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
          return <p className="truncate max-w-sm">{info.getValue()}</p>;
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
              View
            </a>
          );
        },
        footer: (info) => info.column.id,
        header: "Video",
      }),
    ],
    [],
  );

  if (loading || !videos.length) {
    return <Loader />;
  }

  return (
    <PageContainer>
      <PageTitle>Videos</PageTitle>
      <DataTable columns={columns} data={videos} />
    </PageContainer>
  );
};

export default Videos;
