import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { FileUpload } from "../../components/FileUpload/FileUpload";

export const UploadVideos = (): React.ReactElement => {
  return (
    <PageContainer>
      <PageTitle>Upload Videos</PageTitle>
      <FileUpload />
    </PageContainer>
  );
};
