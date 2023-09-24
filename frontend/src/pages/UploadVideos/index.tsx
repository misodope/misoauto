import { useState } from "react";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";

export const UploadVideos = (): React.ReactElement => {
  const [uploadFile, setUploadFile] = useState<null | unknown>(null);
  const handleChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFile(e.target.value);
  };
  console.log("Selected File", uploadFile);
  return (
    <PageContainer>
      <PageTitle>Upload Videos</PageTitle>
      <div className="w-96 h-40 border-dashed rounded border-2 flex items-center justify-center">
        <input type="file" onChange={handleChooseFile} />
      </div>
    </PageContainer>
  );
};
