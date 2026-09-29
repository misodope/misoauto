import {
  badRequest,
  internalServerError,
  sendResponseBody,
} from "@services/utils/response";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Handler,
} from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const THUMBNAIL_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface UploadRequest {
  filename?: string;
  filesize?: number;
  filetype?: string;
  thumbnailFilename?: string;
  thumbnailFilesize?: number;
  thumbnailFiletype?: string;
}

const extensionFor = (filename: string, fallback: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : fallback;
};

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    let requestBody: UploadRequest;

    try {
      requestBody = JSON.parse(event.body ?? "{}");
    } catch {
      return badRequest("Request body must be valid JSON.");
    }

    const {
      filename,
      filesize,
      filetype,
      thumbnailFilename,
      thumbnailFilesize,
      thumbnailFiletype,
    } = requestBody;

    if (!filename || !filesize || !filetype) {
      return badRequest("Video filename, size, and type are required.");
    }
    if (!thumbnailFilename || !thumbnailFilesize || !thumbnailFiletype) {
      return badRequest("A selected thumbnail is required.");
    }
    if (!VIDEO_TYPES.has(filetype) || filesize > MAX_VIDEO_SIZE) {
      return badRequest("Video must be MP4, MOV, or WebM and no larger than 500 MB.");
    }
    if (
      !THUMBNAIL_TYPES.has(thumbnailFiletype) ||
      thumbnailFilesize > MAX_THUMBNAIL_SIZE
    ) {
      return badRequest("Thumbnail must be JPEG, PNG, or WebP and no larger than 10 MB.");
    }

    const region = process.env.LAMBDA_AWS_REGION ?? process.env.AWS_REGION;
    const bucket = process.env.VIDEO_UPLOAD_BUCKET ?? "misoauto";
    if (!region) {
      throw new Error("AWS region is not configured.");
    }

    const uploadId = randomUUID();
    const videoKey = `videos/${uploadId}.${extensionFor(filename, "mp4")}`;
    const thumbnailKey = `thumbnails/${uploadId}.${extensionFor(
      thumbnailFilename,
      "jpg",
    )}`;
    const s3Client = new S3Client({ region });

    const [videoUrl, thumbnailUrl] = await Promise.all([
      getSignedUrl(
        s3Client,
        new PutObjectCommand({ Bucket: bucket, Key: videoKey, ContentType: filetype }),
        { expiresIn: 15 * 60 },
      ),
      getSignedUrl(
        s3Client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey,
          ContentType: thumbnailFiletype,
        }),
        { expiresIn: 15 * 60 },
      ),
    ]);

    return sendResponseBody({
      status: 200,
      message: "Upload destinations created.",
      success: {
        uploadId,
        video: { url: videoUrl, key: videoKey },
        thumbnail: { url: thumbnailUrl, key: thumbnailKey },
      },
    });
  } catch (error) {
    return internalServerError(error);
  }
};
