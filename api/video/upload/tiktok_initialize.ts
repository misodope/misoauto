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

import { Sequelize } from "sequelize";
import { connectToDb } from "@services/database";
import { IVideo, getVideoModel } from "@services/database/models/video";

import dotenv from "dotenv";
import path from "path";
import { TikTokController } from "@services/api/TikTokController";
dotenv.config({ path: path.resolve(__dirname, "../../../", ".env") });

interface UploadListRequestBody {
  access_token: string;
  video_id: string;
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
      return badRequest("No request body provided");
    }

    const requestBody = JSON.parse(event.body);
    const { access_token, video_id, user_id } =
      requestBody as UploadListRequestBody;
    if (!access_token || !video_id || !user_id) {
      return badRequest("Missing required parameters");
    }

    if (!sequelize) {
      sequelize = await connectToDb();
      Video = await getVideoModel(sequelize);
    }

    const video = await Video.findOne({ where: { user_id, id: video_id } });
    if (video === null) {
      return badRequest("Video not found");
    }

    const tiktokController = new TikTokController();

    // const initUploadResponse = await tiktokController.initUpload(
    //   access_token,
    //   1,
    //   1,
    //   1,
    // );

    return sendResponseBody({
      status: 200,
      message: "Successfully Requested Videos List",
      success: video,
    });
  } catch (error) {
    return internalServerError(error);
  }
};
