import { getRedirectUrl } from "../../services/utils/env";
import { AuthController } from "../../services/api/AuthController";
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
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  const authController = new AuthController();
  const redirectUri = getRedirectUrl();
  const { url, csrfState } = authController.getAuthorizationUrl(redirectUri);

  const daysToLive = 1;
  const csrfStateCookie = `csrfState=${csrfState}; Secure; HttpOnly; Max-Age=${
    daysToLive * 24 * 60 * 60
  }`;

  const handlerResponse: APIGatewayProxyResult = {
    statusCode: 302,
    multiValueHeaders: {
      "Set-Cookie": [csrfStateCookie],
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Credentials": true,
      Location: url,
    },
    body: JSON.stringify({ message: "Redirecting to TikTok login" }),
  };

  return handlerResponse;
};
