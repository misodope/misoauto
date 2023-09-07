import {
  AuthController,
  TikTokSuccessResponse,
} from "@services/api/AuthController.js";
import {
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
    // const { csrfState } = event.cookies;
    // if (state !== csrfState) {
    //   res.status(422).send("Invalid state");
    //   return;
    // }
    console.log("PROCESS ENV", process.env);
    const authController = new AuthController();
    const redirectURI = process.env.TIKTOK_REDIRECT_URI || "";
    const response: TikTokSuccessResponse = await authController.getAccessToken(
      code,
      redirectURI,
    );

    console.log("RESPONSE", response);
    let user = await User.findOne({ where: { openId: response.open_id } });
    if (!user) {
      user = await User.create({
        openId: response.open_id,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        scope: response.scope,
        tokenType: response.token_type,
      });
    } else {
      user = await user.update({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        scope: response.scope,
        tokenType: response.token_type,
      });
    }
    console.log("USER", user);
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
