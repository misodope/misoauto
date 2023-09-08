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
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    const tiktokController = new TikTokController();
    const requestBody = JSON.parse(event.body);
    console.log("REQUEST BODY", requestBody);
    const { accessToken } = requestBody;
    console.log("ACCESS TOKEN", accessToken);
    if (!accessToken) {
      return badRequest("No access token provided");
    }

    // TODO: Possibly use cookie to get accessToken?
    const cookie = event.cookies;
    console.log("This is the cookie", cookie);

    const userInfo = await tiktokController.getUserInfo(accessToken);
    return sendResponseBody({
      status: 200,
      message: "Successfully fetched user info",
      success: userInfo,
    });
  } catch (error) {
    return internalServerError(error);
  }
};
