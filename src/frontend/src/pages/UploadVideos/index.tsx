import { useEffect, useRef, useState } from "react";
import { FileUpload } from "../../components/FileUpload/FileUpload";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { PageTitle } from "../../components/PageTitle/PageTitle";
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

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
};

export const UploadVideos = (): React.ReactElement => {
  const [step, setStep] = useState<UploadStep>("video");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [error, setError] = useState("");
  const [uploadedKeys, setUploadedKeys] = useState<{
    video: string;
    thumbnail: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    setDuration(0);
    setCurrentTime(0);
    setUploadedKeys(null);
    setStep("thumbnail");
  };

  const seekVideo = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("The video is not ready yet. Wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("This browser could not capture the selected frame.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) {
      setError("This browser could not create the thumbnail.");
      return;
    }

    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setThumbnailBlob(blob);
    setThumbnailUrl(URL.createObjectURL(blob));
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
      const response = await fetch(getApiUrl() + "/video/upload/presigned/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile.name,
          filesize: uploadFile.size,
          filetype: uploadFile.type,
          thumbnailFilename: `${uploadFile.name.replace(/\.[^.]+$/, "")}-thumbnail.jpg`,
          thumbnailFilesize: thumbnailBlob.size,
          thumbnailFiletype: thumbnailBlob.type,
        }),
      });
      const data = (await response.json()) as ApiResponse<UploadDestination>;
      if (!response.ok) throw new Error(data.message || "Could not prepare the upload.");

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
    setDuration(0);
    setCurrentTime(0);
    setError("");
    setUploadedKeys(null);
    setStep("video");
  };

  const activeStep = step === "video" ? 1 : step === "thumbnail" ? 2 : 3;

  return (
    <PageContainer>
      <div className="w-full max-w-4xl">
        <PageTitle>Upload Video</PageTitle>

        <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Upload progress">
          {["Video", "Thumbnail", "Upload"].map((label, index) => {
            const number = index + 1;
            const active = number <= activeStep;
            return (
              <li
                key={label}
                className={`border-t-2 pt-3 text-sm ${
                  active ? "border-indigo-500 text-gray-900" : "border-gray-300 text-gray-500"
                }`}
                aria-current={number === activeStep ? "step" : undefined}
              >
                <span
                  className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                    active
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {number < activeStep ? "✓" : number}
                </span>
                {label}
              </li>
            );
          })}
        </ol>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          {step === "video" && (
            <div className="flex flex-col items-center">
              <h2 className="mb-2 text-xl font-semibold">Choose a video</h2>
              <p className="mb-5 text-center text-sm text-gray-600">
                Upload a video, then choose the exact frame to use as its thumbnail.
              </p>
              <FileUpload
                handleFileChange={handleFileChange}
                selectedFile={uploadFile}
              />
              <p className="mt-3 text-xs text-gray-500">MP4, MOV, or WebM · Up to 500 MB</p>
            </div>
          )}

          {step === "thumbnail" && uploadFile && (
            <div>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Choose a thumbnail</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Play the video or drag the timeline to the frame you want.
                  </p>
                </div>
                <button type="button" onClick={reset} className="text-sm text-indigo-600 underline">
                  Choose another video
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div>
                  <div className="aspect-video overflow-hidden rounded-lg bg-black">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      playsInline
                      className="h-full w-full object-contain"
                      onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                    />
                  </div>
                  <div className="mt-4 rounded-md bg-gray-50 p-4">
                    <div className="mb-2 flex justify-between gap-4 text-sm">
                      <label htmlFor="video-frame" className="font-medium">Find the best frame</label>
                      <span className="font-mono text-indigo-600">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <input
                      id="video-frame"
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.01"
                      value={currentTime}
                      onChange={(event) => seekVideo(Number(event.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                <aside className="flex flex-col">
                  <div className="flex min-h-48 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
                    <span className="font-medium">Thumbnail preview</span>
                    <span className="mt-1 text-sm text-gray-500">Capture the frame shown in the video.</span>
                  </div>
                  <button
                    type="button"
                    onClick={captureFrame}
                    className="mt-3 rounded bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Use this frame
                  </button>
                </aside>
              </div>
            </div>
          )}

          {step === "review" && thumbnailUrl && uploadFile && (
            <div className="grid items-center gap-8 md:grid-cols-[minmax(200px,320px)_1fr]">
              <div className="overflow-hidden rounded-lg bg-gray-900">
                <img src={thumbnailUrl} alt={`Selected frame at ${formatTime(currentTime)}`} className="max-h-96 w-full object-contain" />
                <p className="p-2 text-center text-xs text-white">Selected at {formatTime(currentTime)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Frame selected</p>
                <h2 className="mt-2 text-2xl font-bold">Ready to upload?</h2>
                <p className="mt-2 text-gray-600">
                  Review the thumbnail before uploading the video and selected frame together.
                </p>
                <dl className="mt-5 divide-y divide-gray-200 border-y border-gray-200 text-sm">
                  <div className="grid grid-cols-[90px_1fr] gap-3 py-3"><dt className="text-gray-500">Video</dt><dd className="break-all">{uploadFile.name}</dd></div>
                  <div className="grid grid-cols-[90px_1fr] gap-3 py-3"><dt className="text-gray-500">Thumbnail</dt><dd>Frame at {formatTime(currentTime)}</dd></div>
                </dl>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => setStep("thumbnail")} className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50">
                    Choose another frame
                  </button>
                  <button type="button" onClick={handleUploadSubmit} className="rounded bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600">
                    Upload video &amp; thumbnail
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "uploading" && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center" aria-live="polite">
              <span className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold">Uploading your video</h2>
              <p className="mt-2 text-sm text-gray-600">Keep this page open while both files are uploaded.</p>
            </div>
          )}

          {step === "success" && uploadedKeys && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center" aria-live="polite">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700" aria-hidden="true">✓</span>
              <h2 className="mt-5 text-2xl font-bold">Upload complete</h2>
              <p className="mt-2 max-w-md text-gray-600">Your video and selected thumbnail are ready for the publishing workflow.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setStep("thumbnail")} className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50">Reselect frame</button>
                <button type="button" onClick={reset} className="rounded bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600">Upload another video</button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
};
