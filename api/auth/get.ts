import { handler } from "./refresh";
import {
  Context,
  APIGatewayProxyEventV2,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";
import UserQueries from "../../services/prisma/queries/user";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const { openId } = event.queryStringParameters as { openId: string };
  if (!openId) {
    return {
      statusCode: 422,
      body: JSON.stringify({ message: "No user id provided" }),
    };
  }

  const userQueries = new UserQueries(prisma);

  try {
    const user: User = await userQueries.getUser(openId);

    const handlerResponse: APIGatewayProxyResult = {
      statusCode: 200,
      body: JSON.stringify(user),
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

export default handler;
