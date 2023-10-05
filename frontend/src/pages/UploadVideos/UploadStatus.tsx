interface UploadStatusProps {
  status: "pending" | "complete";
}

export const UploadStatus: React.FC<UploadStatusProps> = ({ status }) => {
  let bgColor = "bg-gray-300";
  let textColor = "text-gray-700";

  if (status === "complete") {
    bgColor = "bg-green-300";
    textColor = "text-green-700";
  }

  return (
    <div
      className={`inline-block px-2 py-1 rounded-full uppercase text-xs font-bold ${bgColor} ${textColor}`}
    >
      {status}
    </div>
  );
};
