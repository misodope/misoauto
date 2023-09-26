import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import { useState } from "react";
import { getApiUrl } from "../../utils/env";
import Loader from "../../components/Loader/Loader";
import { useAuthContext, AuthContext } from "../../hooks/useAuth";
interface PresignedUrlPart {
  signedUrl: string;
  partNumber: number;
}

interface PresignedUrlResponse {
  presignedUrls: PresignedUrlPart[];
  fileId: string;
  fileKey: string;
}

export const UploadVideos = (): React.ReactElement => {
  const [uploadFile, setUploadFile] = useState<null | File>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<null | string>(null);
  const { authData } = useAuthContext();

  const handleFileChange = (file: File) => {
    setUploadFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      return;
    }

    const blobs = createBlobs(uploadFile);

    setUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(
        getApiUrl() + "/video/upload/presigned/get",
        {
          method: "POST",
          body: JSON.stringify({
            filename: uploadFile.name,
            filesize: uploadFile.size,
            filetype: uploadFile.type,
          }),
        },
      );
      const data = await response.json();
      const { presignedUrls, fileId, fileKey }: PresignedUrlResponse =
        data.response;
      console.log("Presigned Response", presignedUrls);

      const promises = [];
      for (const part of presignedUrls) {
        const { signedUrl, partNumber } = part;
        const blob = blobs[partNumber - 1];
        promises.push(fetch(signedUrl, { method: "PUT", body: blob }));
      }
      const startTime = window.performance.now();
      const responseParts = await Promise.all(promises);
      const totalTime = window.performance.now() - startTime;
      console.log("Upload File Time", (totalTime / 1000).toFixed(2), "seconds");

      const responseDataParts = responseParts.map((response, i) => ({
        ETag: response.headers.get("Etag"),
        PartNumber: i + 1,
      }));
      const completeRequestBody = JSON.stringify({
        fileId,
        fileKey,
        parts: responseDataParts,
        user_id: authData?.open_id,
      });

      await fetch(getApiUrl() + "/video/upload/complete/post", {
        method: "POST",
        body: completeRequestBody,
      });
    } catch (error) {
      console.error("Error Uploading Video", error);
      setUploadError("Sorry, there was an error uploading the video");
    } finally {
      setUploading(false);
      setUploadFile(null);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Upload Videos</PageTitle>
      {uploading ? (
        <Loader isPageLoader={false} />
      ) : (
        <>
          <FileUpload
            handleFileChange={handleFileChange}
            selectedFile={uploadFile}
          />
          <button
            onClick={handleUploadSubmit}
            className="p-2 bg-indigo-500 text-white rounded my-2"
          >
            Submit
          </button>
          {Boolean(uploadError) && (
            <p className="text-red-500 text-sm">{uploadError}</p>
          )}
        </>
      )}
    </PageContainer>
  );
};

const createBlobs = (file: File): Blob[] => {
  const CHUNK = 5 * 1024 * 1024; // 5MB
  const parts = Math.ceil(file.size / CHUNK);

  const blobs: Blob[] = [];

  for (let i = 0; i < parts; i++) {
    const start = i * CHUNK;
    const end = (i + 1) * CHUNK;

    const blob = i < parts ? file.slice(start, end) : file.slice(start);

    blobs.push(blob);
  }

  return blobs;
};
