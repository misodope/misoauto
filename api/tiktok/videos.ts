import {
  badRequest,
  internalServerError,
  sendResponseBody,
} from "@services/utils/response.js";
import { TikTokController } from "../../services/api/TikTokController.js";
import {
  Context,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<{ accessToken: string }>,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  const tiktokController = new TikTokController();
  const { accessToken } = event.requestContext;
  if (!accessToken) {
    return badRequest("No access token provided");
  }

  try {
    const videoListResponse = await tiktokController.getVideos(accessToken);
    return sendResponseBody({
      status: 200,
      success: videoListResponse,
      message: "Successfully fetched videos",
    });
  } catch (error) {
    return internalServerError(error);
  }
};
