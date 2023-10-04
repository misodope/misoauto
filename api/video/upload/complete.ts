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

import { Sequelize } from "sequelize";
import { connectToDb } from "@services/database";
import { IVideo, getVideoModel } from "@services/database/models/video";

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
  fileSize: number;
  fileType: string;
  parts: Part[];
  user_id: string;
}

let sequelize: Sequelize | null = null;
let Video: IVideo | null = null;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<CompleteRequestBody>,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    if (!event.body) {
      return badRequest("No request body provided");
    }

    const requestBody = JSON.parse(event.body);
    const { fileId, fileKey, fileSize, fileType, parts, user_id } =
      requestBody as CompleteRequestBody;

    if (!fileId || !fileKey || !parts || !fileSize || !fileType) {
      return badRequest("No file provided");
    }

    const s3Client = new S3Client({
      region: process.env.LAMBDA_AWS_REGION,
      credentials: {
        accessKeyId: process.env.LAMBDA_AWS_ACCESS_KEY,
        secretAccessKey: process.env.LAMBDA_AWS_SECRET_ACCESS_KEY,
      },
    });

    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);
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

    if (!sequelize) {
      sequelize = await connectToDb();

      Video = await getVideoModel(sequelize);
    }

    let video = await Video.findOne({ where: { key: fileKey, user_id } });
    if (video === null) {
      video = await Video.create({
        id: fileId,
        name: fileKey.split("/")[1],
        bucket: process.env.VIDEO_BUCKET,
        file_size: fileSize,
        file_type: fileType,
        key: fileKey,
        user_id,
      });
    } else {
      video = await video.update({
        id: fileId,
        file_size: fileSize,
        file_type: fileType,
        key: fileKey,
      });
    }

    return sendResponseBody({
      status: 200,
      message: "Successfully Uploaded Video.",
    });
  } catch (error) {
    return internalServerError(error);
  }
};
