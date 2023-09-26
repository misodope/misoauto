import { DataTable } from "../../components/DataTable/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import format from "date-fns/format";
interface UploadVideosTableProps {
  data: Array<Record<string, string>>;
}

export const UploadVideosTable: React.FC<UploadVideosTableProps> = ({
  data,
}) => {
  const columnHelper = createColumnHelper<Record<string, string>>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("key", {
        cell: (info) => {
          const name = info.getValue().split("/").pop();
          return <p>{name}</p>;
        },
        footer: (info) => info.column.id,
        header: "Name",
      }),
      columnHelper.accessor("createdAt", {
        cell: (info) => {
          return <p>{format(new Date(info.getValue()), "MM/dd/yyyy")}</p>;
        },
        footer: (info) => info.column.id,
        header: "Upload Date",
      }),
      columnHelper.accessor("tiktok_video_id", {
        footer: (info) => info.column.id,
        header: "TikTok",
      }),
      columnHelper.accessor("instagram_video_id", {
        footer: (info) => info.column.id,
        header: "Instagram",
      }),
      columnHelper.accessor("youtube_video_id", {
        footer: (info) => info.column.id,
        header: "YouTube",
      }),
    ],
    [],
  );

  return <DataTable columns={columns} data={data ?? []} />;
};

export default UploadVideosTable;
