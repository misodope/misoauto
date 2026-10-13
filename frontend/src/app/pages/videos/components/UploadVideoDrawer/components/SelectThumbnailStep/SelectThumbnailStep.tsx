'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Slider, Text } from '@radix-ui/themes';

interface SelectThumbnailStepProps {
  file: File | null;
  onThumbnailChange: (thumbnail: Blob | null) => void;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const drawPortraitFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
) => {
  const targetAspectRatio = 9 / 16;
  const sourceAspectRatio = video.videoWidth / video.videoHeight;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    sourceWidth = video.videoHeight * targetAspectRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = video.videoWidth / targetAspectRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }

  canvas.width = 720;
  canvas.height = 1280;
  const context = canvas.getContext('2d');
  if (context) {
    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }
};

export default function SelectThumbnailStep({
  file,
  onThumbnailChange,
}: SelectThumbnailStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureGenerationRef = useRef(0);
  const requestedTimeRef = useRef(0);
  const hasValidThumbnailRef = useRef(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [thumbnailError, setThumbnailError] = useState('');

  useEffect(() => {
    if (!file) {
      setVideoUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
    requestedTimeRef.current = 0;
    hasValidThumbnailRef.current = false;
    setThumbnailError('');

    if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    captureGenerationRef.current += 1;
  }, [file]);

  useEffect(
    () => () => {
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
      captureGenerationRef.current += 1;
    },
    [],
  );

  const drawPreviewFrame = () => {
    const video = videoRef.current;
    const canvas = frameCanvasRef.current;
    if (
      !video ||
      !canvas ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }

    drawPortraitFrame(video, canvas);
  };

  const scheduleThumbnailCapture = () => {
    const generation = ++captureGenerationRef.current;
    if (captureTimerRef.current) clearTimeout(captureTimerRef.current);

    captureTimerRef.current = setTimeout(() => {
      captureTimerRef.current = null;
      const canvas = frameCanvasRef.current;
      if (!canvas) return;

      canvas.toBlob(
        (blob) => {
          if (generation !== captureGenerationRef.current) return;
          if (blob) {
            hasValidThumbnailRef.current = true;
            onThumbnailChange(blob);
            setThumbnailError('');
          } else {
            setThumbnailError('Could not create a thumbnail from this frame.');
          }
        },
        'image/jpeg',
        0.9,
      );
    }, 120);
  };

  const handleVideoSeeked = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const timeTolerance = Math.max(0.05, duration / 1000);
    if (Math.abs(video.currentTime - requestedTimeRef.current) > timeTolerance) {
      return;
    }
    setCurrentTime(video.currentTime);
    drawPreviewFrame();
    scheduleThumbnailCapture();
  };

  if (!file || !videoUrl) {
    return (
      <Text size="2" color="gray">
        Go back and choose a video file first.
      </Text>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <Box>
        <Flex justify="center">
          <canvas
            ref={frameCanvasRef}
            role="img"
            aria-label={`Video frame at ${formatTime(currentTime)}`}
            style={{
              aspectRatio: '9 / 16',
              background: 'var(--gray-3)',
              borderRadius: '8px',
              display: 'block',
              height: 'min(480px, 50vh)',
              maxWidth: '100%',
              width: 'auto',
            }}
          />
        </Flex>
        <Text size="1" color="gray" mt="2" aria-live="polite">
          Frame preview at {formatTime(currentTime)}
        </Text>
      </Box>

      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        muted
        preload="metadata"
        onLoadedMetadata={(event) => {
          const mediaDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(mediaDuration) ? mediaDuration : 0);
          setCurrentTime(0);
        }}
        onLoadedData={() => {
          const video = videoRef.current;
          if (video) {
            requestedTimeRef.current = video.currentTime;
            setCurrentTime(video.currentTime);
          }
          drawPreviewFrame();
          scheduleThumbnailCapture();
        }}
        onSeeked={handleVideoSeeked}
        onError={() => {
          setThumbnailError(
            'This video could not be previewed in your browser. Try an MP4 or MOV file.',
          );
        }}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          height: '1px',
          left: '-10000px',
          opacity: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          position: 'absolute',
          width: '1px',
        }}
      />

      {duration > 0 && (
        <Box>
          <Slider
            aria-label="Thumbnail frame position"
            min={0}
            max={duration}
            step={Math.max(duration / 1000, 0.01)}
            value={[Math.min(currentTime, duration)]}
            onValueChange={([value]) => {
              if (value === undefined) return;
              setCurrentTime(value);
              requestedTimeRef.current = value;
              captureGenerationRef.current += 1;
              if (captureTimerRef.current) {
                clearTimeout(captureTimerRef.current);
                captureTimerRef.current = null;
              }
              if (videoRef.current) {
                const video = videoRef.current;
                if (Math.abs(video.currentTime - value) >= 0.01) {
                  if (hasValidThumbnailRef.current) {
                    hasValidThumbnailRef.current = false;
                    onThumbnailChange(null);
                  }
                  video.currentTime = value;
                } else {
                  drawPreviewFrame();
                  scheduleThumbnailCapture();
                }
              }
            }}
          />
          <Flex justify="between" mt="1">
            <Text size="1" color="gray">{formatTime(currentTime)}</Text>
            <Text size="1" color="gray">{formatTime(duration)}</Text>
          </Flex>
        </Box>
      )}

      <Text size="2" color="gray">
        Drag the slider to choose a frame. The thumbnail updates automatically
        at {formatTime(currentTime)}.
      </Text>

      {thumbnailError && (
        <Text role="alert" size="2" color="red">
          {thumbnailError}
        </Text>
      )}

    </Flex>
  );
}
