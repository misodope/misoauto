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
      return badRequest("No request body provided");
    }

    const requestBody = JSON.parse(event.body);
    const { user_id } = requestBody as UploadListRequestBody;
    if (!user_id) {
      return badRequest("No User provided");
    }

    if (!sequelize) {
      sequelize = await connectToDb();

      Video = await getVideoModel(sequelize);
    }

    let videos = await Video.findAll({ where: { user_id } });
    if (!videos) {
      videos = [];
    }

    return sendResponseBody({
      status: 200,
      message: "Successfully Requested Videos List",
      success: videos,
    });
  } catch (error) {
    return internalServerError(error);
  }
};
