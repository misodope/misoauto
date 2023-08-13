import {
  AuthController,
  TikTokSuccessResponse,
} from "../../services/api/AuthController.js";
import UserQueries from "../../services/prisma/queries/user.js";
import {
  getCurrentRequestEnv,
  getRedirectUrl,
} from "../../services/utils/env.js";
import {
  Context,
  APIGatewayProxyEventV2,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";

import { PrismaClient } from "@prisma/client";
import { User } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e: any) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
  console.log("------------------------------------------------------");
});

prisma.$on("beforeExit", (e: any) => {
  console.log("beforeExit hook", e);
});

const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const { code, state } = event.queryStringParameters as {
    code: string;
    state: string;
  };

  // const { csrfState } = event.cookies;
  // if (state !== csrfState) {
  //   res.status(422).send("Invalid state");
  //   return;
  // }

  try {
    const authController = new AuthController();
    const userQueries = new UserQueries(prisma);
    const redirectUri = getRedirectUrl();

    const response: TikTokSuccessResponse = await authController.getAccessToken(
      code,
      redirectUri,
    );

    let user: User = await userQueries.getUser(response.open_id);

    if (!user) {
      user = await userQueries.createUser(response);
    } else {
      user = await userQueries.updateUser(response.open_id, response);
    }

    const handlerResponse: APIGatewayProxyResult = {
      statusCode: 302,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": true,
        Location: `/dashboard/?user=${user.openId}`,
      },
      body: JSON.stringify({ message: "Redirecting to dashboard" }),
    };

    // return res.redirect(`/dashboard/?user=${user.openId}`);
    return handlerResponse;
  } catch (error) {
    console.error(error);
    const handlerErrorResponse: APIGatewayProxyResult = {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
    return handlerErrorResponse;
  }
};

export default handler;
