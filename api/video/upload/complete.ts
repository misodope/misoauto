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
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandInput,
} from "@aws-sdk/client-s3";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../", ".env") });

interface Part {
  ETag: string;
  PartNumber: number;
}

interface CompleteRequestBody {
  fileId: string;
  fileKey: string;
  parts: Part[];
}

export const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<CompleteRequestBody>,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    if (!event.body) {
      badRequest("No request body provided");
    }

    const requestBody = JSON.parse(event.body);
    const { fileId, fileKey, parts } = requestBody as CompleteRequestBody;
    if (!fileId || !fileKey || !parts) {
      badRequest("No file provided");
    }

    const s3Client = new S3Client({
      region: process.env.LAMBDA_AWS_REGION,
      credentials: {
        accessKeyId: process.env.LAMBDA_AWS_ACCESS_KEY,
        secretAccessKey: process.env.LAMBDA_AWS_SECRET_ACCESS_KEY,
      },
    });

    const sortedParts = parts.toSorted((a, b) => a.PartNumber - b.PartNumber);
    const completeMultipartParams: CompleteMultipartUploadCommandInput = {
      Bucket: process.env.VIDEO_BUCKET,
      Key: fileKey,
      UploadId: fileId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    };

    const uploadCommand = new CompleteMultipartUploadCommand(
      completeMultipartParams,
    );

    await s3Client.send(uploadCommand);

    return sendResponseBody({
      status: 200,
      message: "Successfully Uploaded Video.",
    });
  } catch (error) {
    return internalServerError(error);
  }
};
