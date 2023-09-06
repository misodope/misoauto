import {
  Context,
  APIGatewayProxyEventV2,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { Sequelize } from "sequelize";
import { IUser, getUserModel } from "@services/database/models/user";
import { connectToDb } from "@services/database";

let sequelize: Sequelize | null = null;
let User: IUser | null = null;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  if (!sequelize) {
    sequelize = await connectToDb();
    User = await getUserModel(sequelize);
  }

  try {
    const { openId } = event.queryStringParameters as { openId: string };
    if (!openId) {
      return {
        statusCode: 422,
        body: JSON.stringify({ message: "No user id provided" }),
      };
    }

    const user = await User.findOne({ where: { openId } });
    console.log("USER", user);
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
