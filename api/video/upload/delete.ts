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
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { Sequelize, Op } from "sequelize";
import { connectToDb } from "@services/database";
import { IVideo, getVideoModel } from "@services/database/models/video";
import { startOfDay } from "date-fns";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../", ".env") });

interface UploadListRequestBody {
  user_id: string;
}

let sequelize: Sequelize | null = null;
let Video: IVideo | null = null;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<UploadListRequestBody>,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    if (!event.body) {
      badRequest("No request body provided");
    }

    const requestBody = JSON.parse(event.body);
    const { user_id } = requestBody as UploadListRequestBody;
    if (!user_id) {
      badRequest("No User provided");
    }

    if (!sequelize) {
      sequelize = await connectToDb();

      Video = await getVideoModel(sequelize);
    }

    const today = startOfDay(new Date());
    const videos = await Video.findAll({
      where: {
        user_id,
        createdAt: {
          [Op.lt]: today,
        },
      },
    });
    console.log("Videos to be deleted: ", videos);
    if (videos.length === 0) {
      return sendResponseBody({
        status: 200,
        message: "No videos to be deleted",
        success: [],
      });
    }

    const deletedVideos = await Video.destroy({
      where: {
        user_id,
        createdAt: {
          [Op.lt]: today,
        },
      },
    });
    console.log(`Deleted ${deletedVideos} videos from database`);

    const s3Client = new S3Client({
      region: process.env.LAMBDA_AWS_REGION,
      credentials: {
        accessKeyId: process.env.LAMBDA_AWS_ACCESS_KEY,
        secretAccessKey: process.env.LAMBDA_AWS_SECRET_ACCESS_KEY,
      },
    });

    const deleteObjectsCommand = new DeleteObjectsCommand({
      Bucket: process.env.VIDEO_BUCKET,
      Delete: {
        Objects: videos.map((video: any) => ({ Key: video.key })),
      },
    });

    await s3Client.send(deleteObjectsCommand);

    return sendResponseBody({
      status: 200,
      message: "Successfully Deleted Videos",
      success: videos,
    });
  } catch (error) {
    return internalServerError(error);
  }
};
