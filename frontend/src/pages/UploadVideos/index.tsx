import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import { useState } from "react";
import { getApiUrl } from "../../utils/env";
import Loader from "../../components/Loader/Loader";

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
      const signedUrl = data.response;
      console.log("Signed URL", signedUrl);
      await fetch(signedUrl, {
        method: "PUT",
        body: uploadFile,
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
