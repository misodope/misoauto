import { AuthController } from "@services/api/AuthController";
import {
  internalServerError,
  sendResponseBody,
} from "@services/utils/response";
import {
  Context,
  APIGatewayProxyEventV2,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    const authController = new AuthController();
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || "";

    const { url, csrfState } = authController.getAuthorizationUrl(redirectUri);

    const daysToLive = 1;
    const csrfStateCookie = `csrfState=${csrfState}; Secure; HttpOnly; Max-Age=${
      daysToLive * 24 * 60 * 60
    }`;

    return sendResponseBody({
      status: 302,
      message: "Redirecting to TikTok login",
      success: {},
      multiValueHeaders: {
        "Set-Cookie": [csrfStateCookie],
      },
      headers: {
        Location: url,
      },
    });
  } catch (error) {
    return internalServerError(error);
  }
};
