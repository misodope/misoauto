import {
  badRequest,
  internalServerError,
  sendResponseBody,
} from "@services/utils/response";

import {
  Context,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../", ".env") });

const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB

export const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<{
    filename: string;
    filetype: string;
    filesize: string;
  }>,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    if (!event.body) {
      badRequest("No request body provided");
    }

    const requestBody = JSON.parse(event.body);
    const { filename, filesize, filetype } = requestBody;
    if (!filename) {
      badRequest("No file provided");
    }

    const s3Client = new S3Client({
      region: process.env.LAMBDA_AWS_REGION,
      credentials: {
        accessKeyId: process.env.LAMBDA_AWS_ACCESS_KEY,
        secretAccessKey: process.env.LAMBDA_AWS_SECRET_ACCESS_KEY,
      },
    });

    const uploadCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.VIDEO_BUCKET,
      Key: `videos/${filename}`,
      ContentType: filetype,
    });

    const { UploadId, Key } = await s3Client.send(uploadCommand);

    const parts = Math.ceil(Number(filesize) / CHUNK_SIZE);
    console.log("Part Size", parts);

    const presignedUrls = await makePresignedUrls(
      s3Client,
      Key,
      UploadId,
      process.env.VIDEO_BUCKET,
      parts,
    );

    return sendResponseBody({
      status: 200,
      message: "Successfully generated upload urls.",
      success: {
        fileId: UploadId,
        fileKey: Key,
        presignedUrls,
      },
    });
  } catch (error) {
    return internalServerError(error);
  }
};

const makePresignedUrls = async (
  s3Client: S3Client,
  fileKey: string,
  fileId: string,
  bucket: string,
  parts: number,
): Promise<Array<{ signedUrl: string; partNumber: number }>> => {
  const multipartParams = {
    Bucket: bucket,
    Key: fileKey,
    UploadId: fileId,
  };
  const promises = [];
  for (let i = 0; i < parts; i++) {
    const uploadPartCommand = new UploadPartCommand({
      ...multipartParams,
      PartNumber: i + 1,
    });

    const presignedUrl = await getSignedUrl(s3Client, uploadPartCommand, {
      expiresIn: 15 * 60,
    });

    promises.push(presignedUrl);
  }

  const signedUrls = await Promise.all(promises);

  return signedUrls.map((signedUrl, index) => {
    return {
      signedUrl,
      partNumber: index + 1,
    };
  });
};
