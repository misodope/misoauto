import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import { useState } from "react";
import { getApiUrl } from "../../utils/env";

export const UploadVideos = (): React.ReactElement => {
  const [uploadFile, setUploadFile] = useState<null | File>(null);

  const handleFileChange = (file: File) => {
    setUploadFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      return;
    }

    try {
      const response = await fetch(getApiUrl() + "/video/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: uploadFile.name,
          filesize: uploadFile.size,
        }),
      });

      const data = await response.json();
      const signedUrl = data.response.signedUrl;

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: uploadFile,
      });

      const uploadData = await uploadResponse.json();

      console.log("Upload Response", uploadData);
      console.log("Upload Video Response", data);
    } catch (error) {
      console.error("Error Uploading Video", error);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Upload Videos</PageTitle>
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
    </PageContainer>
  );
};
