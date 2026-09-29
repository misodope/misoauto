import { ButtonHTMLAttributes, ReactNode, useRef, useState } from "react";
import Loader from "../Loader/Loader";

type ButtonVariant = "primary" | "secondary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-500 text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
  text: "text-indigo-600 underline hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50",
};

export const Button = ({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`rounded px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${buttonStyles[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}

export const Card = ({
  children,
  className = "",
  as = "section",
}: CardProps) => {
  const classes = `rounded-lg border border-gray-200 shadow-sm ${className}`;
  return as === "section" ? (
    <section className={classes}>{children}</section>
  ) : (
    <div className={classes}>{children}</div>
  );
};

interface AlertProps {
  children: ReactNode;
  tone?: "error" | "info";
}

const alertStyles = {
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export const Alert = ({ children, tone = "error" }: AlertProps) => (
  <div
    className={`rounded-md border p-3 text-sm ${alertStyles[tone]}`}
    role="alert"
  >
    {children}
  </div>
);

interface ProgressStepsProps {
  labels: string[];
  activeStep: number;
}

export const ProgressSteps = ({ labels, activeStep }: ProgressStepsProps) => (
  <ol
    className="mb-6 grid gap-2"
    style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
    aria-label="Upload progress"
  >
    {labels.map((label, index) => {
      const number = index + 1;
      const active = number <= activeStep;
      return (
        <li
          key={label}
          className={`border-t-2 pt-3 text-sm ${
            active
              ? "border-indigo-500 text-gray-900"
              : "border-gray-300 text-gray-500"
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
);

interface UploadPromptProps {
  title: string;
  description: string;
  guidance: string;
  children: ReactNode;
}

export const UploadPrompt = ({
  title,
  description,
  guidance,
  children,
}: UploadPromptProps) => (
  <div className="flex flex-col items-center">
    <h2 className="mb-2 text-xl font-semibold">{title}</h2>
    <p className="mb-5 text-center text-sm text-gray-600">{description}</p>
    {children}
    <p className="mt-3 text-xs text-gray-500">{guidance}</p>
  </div>
);

interface CapturedFrame {
  blob: Blob;
  time: number;
}

interface VideoFramePickerProps {
  videoUrl: string;
  initialTime: number;
  onCapture: (frame: CapturedFrame) => void;
  onChooseAnotherVideo: () => void;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
};

export const VideoFramePicker = ({
  videoUrl,
  initialTime,
  onCapture,
  onChooseAnotherVideo,
}: VideoFramePickerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [captureError, setCaptureError] = useState("");

  const seekVideo = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCaptureError(
        "The video is not ready yet. Wait a moment and try again.",
      );
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const capturedTime = video.currentTime;
    const context = canvas.getContext("2d");
    if (!context) {
      setCaptureError("This browser could not capture the selected frame.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) {
      setCaptureError("This browser could not create the thumbnail.");
      return;
    }

    setCaptureError("");
    onCapture({ blob, time: capturedTime });
  };

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Choose a thumbnail</h2>
          <p className="mt-1 text-sm text-gray-600">
            Play the video or drag the timeline to the frame you want.
          </p>
        </div>
        <Button variant="text" onClick={onChooseAnotherVideo}>
          Choose another video
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <Card
            as="div"
            className="aspect-video overflow-hidden border-0 bg-black shadow-none"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              className="h-full w-full object-contain"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                setDuration(video.duration);
                if (initialTime > 0)
                  video.currentTime = Math.min(initialTime, video.duration);
                setCurrentTime(Math.min(initialTime, video.duration));
              }}
              onTimeUpdate={(event) =>
                setCurrentTime(event.currentTarget.currentTime)
              }
            />
          </Card>
          <Card as="div" className="mt-4 bg-gray-50 p-4 shadow-none">
            <div className="mb-2 flex justify-between gap-4 text-sm">
              <label htmlFor="video-frame" className="font-medium">
                Find the best frame
              </label>
              <span className="font-mono text-indigo-600" aria-live="polite">
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
          </Card>
        </div>

        <aside className="flex flex-col">
          <Card
            as="div"
            className="flex min-h-48 flex-1 flex-col items-center justify-center border-dashed bg-gray-50 p-5 text-center shadow-none"
          >
            <span className="font-medium">Thumbnail preview</span>
            <span className="mt-1 text-sm text-gray-500">
              Capture the frame shown in the video.
            </span>
          </Card>
          <Button className="mt-3 w-full py-3" onClick={captureFrame}>
            Use this frame
          </Button>
        </aside>
      </div>
      {captureError && (
        <div className="mt-4">
          <Alert>{captureError}</Alert>
        </div>
      )}
    </div>
  );
};

interface ThumbnailReviewProps {
  thumbnailUrl: string;
  fileName: string;
  selectedTime: number;
  onReselect: () => void;
  onUpload: () => void;
}

export const ThumbnailReview = ({
  thumbnailUrl,
  fileName,
  selectedTime,
  onReselect,
  onUpload,
}: ThumbnailReviewProps) => (
  <div className="grid items-center gap-8 md:grid-cols-[minmax(200px,320px)_1fr]">
    <Card as="div" className="overflow-hidden bg-gray-900 shadow-none">
      <img
        src={thumbnailUrl}
        alt={`Selected frame at ${formatTime(selectedTime)}`}
        className="max-h-96 w-full object-contain"
      />
      <p className="p-2 text-center text-xs text-white">
        Selected at {formatTime(selectedTime)}
      </p>
    </Card>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
        Frame selected
      </p>
      <h2 className="mt-2 text-2xl font-bold">Ready to upload?</h2>
      <p className="mt-2 text-gray-600">
        Review the thumbnail before uploading the video and selected frame
        together.
      </p>
      <dl className="mt-5 divide-y divide-gray-200 border-y border-gray-200 text-sm">
        <div className="grid grid-cols-[90px_1fr] gap-3 py-3">
          <dt className="text-gray-500">Video</dt>
          <dd className="break-all">{fileName}</dd>
        </div>
        <div className="grid grid-cols-[90px_1fr] gap-3 py-3">
          <dt className="text-gray-500">Thumbnail</dt>
          <dd>Frame at {formatTime(selectedTime)}</dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" onClick={onReselect}>
          Choose another frame
        </Button>
        <Button onClick={onUpload}>Upload video &amp; thumbnail</Button>
      </div>
    </div>
  </div>
);

interface UploadResultProps {
  busy?: boolean;
  title: string;
  description: string;
  children?: ReactNode;
}

export const UploadResult = ({
  busy = false,
  title,
  description,
  children,
}: UploadResultProps) => (
  <div
    className="flex min-h-72 flex-col items-center justify-center text-center"
    aria-live="polite"
  >
    {busy ? (
      <Loader isPageLoader={false} />
    ) : (
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700"
        aria-hidden="true"
      >
        ✓
      </span>
    )}
    <h2 className="mt-5 text-2xl font-bold">{title}</h2>
    <p className="mt-2 max-w-md text-gray-600">{description}</p>
    {children}
  </div>
);
