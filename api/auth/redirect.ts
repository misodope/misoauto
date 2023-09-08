import {
  AuthController,
  TikTokSuccessResponse,
} from "@services/api/AuthController.js";
import {
  badRequest,
  internalServerError,
  sendResponseBody,
} from "@services/utils/response";
import {
  Context,
  APIGatewayProxyEventV2,
  Handler,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import { Sequelize } from "sequelize";
import { IUser, getUserModel } from "@services/database/models/user";
import { connectToDb } from "@services/database";

import UserQueries from "@services/database/queries/user";

let sequelize: Sequelize | null = null;
let User: IUser | null = null;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    if (!sequelize) {
      sequelize = await connectToDb();
      User = await getUserModel(sequelize);
    }

    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;

    console.log("CODE", code);
    console.log("STATE", state);
    console.log("COOKIES", event.cookies);

    const csrfState = getCookie("csrfState", event.cookies);
    if (state !== csrfState) {
      return badRequest("Invalid State");
    }
    const authController = new AuthController();
    const redirectURI = process.env.TIKTOK_REDIRECT_URI || "";
    const response: TikTokSuccessResponse = await authController.getAccessToken(
      code,
      redirectURI,
    );
    console.log("RESPONSE", response);

    let user = await User.findOne({ where: { open_id: response.open_id } });
    if (!user) {
      user = await User.create({
        open_id: response.open_id,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expire_in: response.expires_in,
        scope: response.scope,
        token_type: response.token_type,
      });
    } else {
      user = await user.update({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expire_in: response.expires_in,
        scope: response.scope,
        token_type: response.token_type,
      });
    }

    return sendResponseBody({
      status: 302,
      message: "Redirecting to TikTok login",
      success: {},
      headers: {
        // TODO: Update with ?user=${user.openId}
        Location: `https://dl7rsqqwy6kne.cloudfront.net/dashboard/?user=${response.open_id}`,
      },
    });
  } catch (error) {
    return internalServerError(error);
  }
  // try {
  // const authController = new AuthController();
  //   const userQueries = new UserQueries(prisma);
  //   const redirectUri =
  //     "https://ilywoklih4.execute-api.us-east-1.amazonaws.com/api/auth/redirect";

  // const response: TikTokSuccessResponse = await authController.getAccessToken(
  //   code,
  //   redirectUri,
  // );

  //   let user: User = await userQueries.getUser(response.open_id);

  //   if (!user) {
  //     user = await userQueries.createUser(response);
  //   } else {
  //     user = await userQueries.updateUser(response.open_id, response);
  //   }

  //   const handlerResponse: APIGatewayProxyResult = {
  //     statusCode: 302,
  //     headers: {
  //       "Access-Control-Allow-Origin": "*",
  //       "Access-Control-Allow-Headers": "*",
  //       "Access-Control-Allow-Credentials": true,
  //       Location: `https://dl7rsqqwy6kne.cloudfront.net/dashboard/?user=${user.openId}`,
  //     },
  //     body: JSON.stringify({ message: "Redirecting to dashboard" }),
  //   };

  //   return handlerResponse;
  // } catch (error) {
  //   console.error(error);
  //   const handlerErrorResponse: APIGatewayProxyResult = {
  //     statusCode: 500,
  //     body: JSON.stringify({ message: "Internal Server Error" }),
  //   };
  //   return handlerErrorResponse;
  // }
};

// Cookies example = [ 'csrfState=12345abc' ]
const getCookie = (name: string, cookies: Array<string>): string | null => {
  const cookie = cookies.find((cookie) => cookie.includes(name));
  if (!cookie) {
    return null;
  }
  const cookieParts = cookie.split("=");
  return cookieParts[1];
};
