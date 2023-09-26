import Loader from "../../components/Loader/Loader";
import { useFetch } from "../../hooks/useFetch";

import { DataTable } from "../../components/DataTable/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { useAuthContext } from "../../hooks/useAuth";

export const UploadVideosTable = () => {
  const { authData } = useAuthContext();

  const { data: videoData, loading } = useFetch({
    url: `/video/upload/list`,
    method: "POST",
    body: JSON.stringify({ user_id: authData?.open_id }),
  });

  const videos: Array<{}> = videoData?.data.videos ?? [];
  console.log("Videos", videos);

  const columnHelper = createColumnHelper<Record<string, string>>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("key", {
        cell: (info) => {
          const name = info.getValue().split("/").pop();
          return <p>{name}</p>;
        },
        footer: (info) => info.column.id,
        header: "Video ID",
      }),
      columnHelper.accessor("createdAt", {
        cell: (info) => {
          return <p>{info.getValue()}</p>;
        },
        footer: (info) => info.column.id,
        header: "Upload Date",
      }),
      columnHelper.accessor("tiktok_video_id", {
        footer: (info) => info.column.id,
        header: "TikTok Upload Status",
      }),
      columnHelper.accessor("instagram_video_id", {
        footer: (info) => info.column.id,
        header: "Instagram Upload Status",
      }),
      columnHelper.accessor("youtube_video_id", {
        footer: (info) => info.column.id,
        header: "YouTube Upload Status",
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

export default UploadVideosTable;
