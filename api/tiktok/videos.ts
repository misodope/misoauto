import { TikTokController } from "../../services/api/TikTokController.js";
import {
  Context,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";

const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<{ accessToken: string }>,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  const tiktokController = new TikTokController();
  const { accessToken } = event.requestContext;
  if (!accessToken) {
    return {
      statusCode: 422,
      body: JSON.stringify({ message: "No access token provided" }),
    };
  }

  try {
    const videoListResponse = await tiktokController.getVideos(accessToken);
    const handlerResponse: APIGatewayProxyResult = {
      statusCode: 200,
      body: JSON.stringify(videoListResponse),
    };
    return handlerResponse;
  } catch (error) {
    console.error(error);
    const handlerErrorResponse: APIGatewayProxyResult = {
      statusCode: 404,
      body: JSON.stringify({
        message: "Sorry, we're having trouble fetching videos",
      }),
    };
    return handlerErrorResponse;
  }
};

export default handler;
