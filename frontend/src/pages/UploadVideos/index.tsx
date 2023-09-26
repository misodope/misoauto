import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import { useState } from "react";
import { getApiUrl } from "../../utils/env";
import Loader from "../../components/Loader/Loader";

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

  const handleFileChange = (file: File) => {
    setUploadFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      return;
    }

    const blobs = createBlobs(uploadFile);

    setUploading(true);

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

      const responseParts = await Promise.all(promises);
      const responseDataParts = responseParts.map((response, i) => ({
        ETag: response.headers.get("Etag"),
        PartNumber: i + 1,
      }));
      console.log("Response Data Parts", responseDataParts);
      const completeRequestBody = JSON.stringify({
        fileId,
        fileKey,
        parts: responseDataParts,
      });
      console.log("Complete Request Body", completeRequestBody);

      await fetch(getApiUrl() + "/video/upload/complete/post", {
        method: "POST",
        body: completeRequestBody,
      });
    } catch (error) {
      console.error("Error Uploading Video", error);
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
