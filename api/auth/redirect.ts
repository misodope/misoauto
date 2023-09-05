import {
  AuthController,
  TikTokSuccessResponse,
} from "../../services/api/AuthController.js";
import UserQueries from "../../services/prisma/queries/user.js";
import {
  Context,
  APIGatewayProxyEventV2,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";

import { PrismaClient, User } from "../../generated/prisma";

const prisma = new PrismaClient();

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);
  console.log("PRISMA", prisma);
  // const { code, state } = event.queryStringParameters as {
  //   code: string;
  //   state: string;
  // };

  // const { csrfState } = event.cookies;
  // if (state !== csrfState) {
  //   res.status(422).send("Invalid state");
  //   return;
  // }

  // try {
  //   const authController = new AuthController();
  //   const userQueries = new UserQueries(prisma);
  //   const redirectUri =
  //     "https://ilywoklih4.execute-api.us-east-1.amazonaws.com/api/auth/redirect/";

  //   const response: TikTokSuccessResponse = await authController.getAccessToken(
  //     code,
  //     redirectUri,
  //   );

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
  const handlerResponse: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({ message: "Refresh Endpoint!" }),
  };

  return handlerResponse;
};
