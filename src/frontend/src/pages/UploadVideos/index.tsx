import { useEffect, useState } from "react";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import {
  Alert,
  Button,
  Card,
  ProgressSteps,
  ThumbnailReview,
  UploadPrompt,
  UploadResult,
  VideoFramePicker,
} from "../../components/ui";
import { getApiUrl } from "../../utils/env";

type UploadStep = "video" | "thumbnail" | "review" | "uploading" | "success";

interface UploadDestination {
  uploadId: string;
  video: { url: string; key: string };
  thumbnail: { url: string; key: string };
}

interface ApiResponse<T> {
  message: string;
  response: T;
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const UploadVideos = (): React.ReactElement => {
  const [step, setStep] = useState<UploadStep>("video");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedTime, setSelectedTime] = useState(0);
  const [error, setError] = useState("");
  const [uploadedKeys, setUploadedKeys] = useState<{
    video: string;
    thumbnail: string;
  } | null>(null);

  useEffect(
    () => () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    },
    [videoUrl],
  );

  useEffect(
    () => () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    },
    [thumbnailUrl],
  );

  const handleFileChange = (file: File) => {
    setError("");
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      setError("Choose an MP4, MOV, or WebM video.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setError("Choose a video no larger than 500 MB.");
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setUploadFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setThumbnailBlob(null);
    setThumbnailUrl("");
    setSelectedTime(0);
    setUploadedKeys(null);
    setStep("thumbnail");
  };

  const handleFrameCapture = ({ blob, time }: { blob: Blob; time: number }) => {
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setThumbnailBlob(blob);
    setThumbnailUrl(URL.createObjectURL(blob));
    setSelectedTime(time);
    setError("");
    setStep("review");
  };

  const uploadAsset = async (url: string, body: Blob, contentType: string) => {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body,
    });
    if (!response.ok) throw new Error("Asset upload failed.");
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !thumbnailBlob) return;
    setError("");
    setStep("uploading");

    try {
      const response = await fetch(
        getApiUrl() + "/video/upload/presigned/get",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: uploadFile.name,
            filesize: uploadFile.size,
            filetype: uploadFile.type,
            thumbnailFilename: `${uploadFile.name.replace(
              /\.[^.]+$/,
              "",
            )}-thumbnail.jpg`,
            thumbnailFilesize: thumbnailBlob.size,
            thumbnailFiletype: thumbnailBlob.type,
          }),
        },
      );
      const data = (await response.json()) as ApiResponse<UploadDestination>;
      if (!response.ok)
        throw new Error(data.message || "Could not prepare the upload.");

      await Promise.all([
        uploadAsset(data.response.video.url, uploadFile, uploadFile.type),
        uploadAsset(
          data.response.thumbnail.url,
          thumbnailBlob,
          thumbnailBlob.type,
        ),
      ]);
      setUploadedKeys({
        video: data.response.video.key,
        thumbnail: data.response.thumbnail.key,
      });
      setStep("success");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The upload failed. Please try again.",
      );
      setStep("review");
    }
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setUploadFile(null);
    setVideoUrl("");
    setThumbnailBlob(null);
    setThumbnailUrl("");
    setSelectedTime(0);
    setError("");
    setUploadedKeys(null);
    setStep("video");
  };

  const activeStep = step === "video" ? 1 : step === "thumbnail" ? 2 : 3;

  return (
    <PageContainer>
      <div className="w-full max-w-4xl">
        <PageTitle>Upload Video</PageTitle>
        <ProgressSteps
          labels={["Video", "Thumbnail", "Upload"]}
          activeStep={activeStep}
        />

        <Card className="bg-white p-4 sm:p-6">
          {step === "video" && (
            <UploadPrompt
              title="Choose a video"
              description="Upload a video, then choose the exact frame to use as its thumbnail."
              guidance="MP4, MOV, or WebM · Up to 500 MB"
            >
              <FileUpload
                handleFileChange={handleFileChange}
                selectedFile={uploadFile}
              />
            </UploadPrompt>
          )}

          {step === "thumbnail" && uploadFile && (
            <VideoFramePicker
              videoUrl={videoUrl}
              initialTime={selectedTime}
              onCapture={handleFrameCapture}
              onChooseAnotherVideo={reset}
            />
          )}

          {step === "review" && thumbnailUrl && uploadFile && (
            <ThumbnailReview
              thumbnailUrl={thumbnailUrl}
              fileName={uploadFile.name}
              selectedTime={selectedTime}
              onReselect={() => setStep("thumbnail")}
              onUpload={handleUploadSubmit}
            />
          )}

          {step === "uploading" && (
            <UploadResult
              busy
              title="Uploading your video"
              description="Keep this page open while both files are uploaded."
            />
          )}

          {step === "success" && uploadedKeys && (
            <UploadResult
              title="Upload complete"
              description="Your video and selected thumbnail are ready for the publishing workflow."
            >
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => setStep("thumbnail")}
                >
                  Reselect frame
                </Button>
                <Button onClick={reset}>Upload another video</Button>
              </div>
            </UploadResult>
          )}

          {error && <Alert>{error}</Alert>}
        </Card>
      </div>
    </PageContainer>
  );
};
