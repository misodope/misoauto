import { TikTokController } from "../../services/api/TikTokController.js";
import {
  Context,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";

export const handler: Handler = async (
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

  // TODO: Possibly use cookie to get accessToken?
  const cookie = event.cookies;
  console.log("This is the cookie", cookie);

  try {
    const userInfo = await tiktokController.getUserInfo(accessToken);
    const handlerResponse: APIGatewayProxyResult = {
      statusCode: 200,
      body: JSON.stringify(userInfo),
    };
    return handlerResponse;
  } catch {
    // Return error message if user is not found
    const handlerErrorResponse: APIGatewayProxyResult = {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
    return handlerErrorResponse;
  }
};
