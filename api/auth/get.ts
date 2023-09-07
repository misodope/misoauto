import {
  Context,
  APIGatewayProxyEventV2,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { Sequelize } from "sequelize";
import { IUser, getUserModel } from "@services/database/models/user";
import { connectToDb } from "@services/database";
import {
  badRequest,
  internalServerError,
  sendResponseBody,
} from "@services/utils/response";

let sequelize: Sequelize | null = null;
let User: IUser | null = null;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    if (!sequelize) {
      sequelize = await connectToDb();
      User = await getUserModel(sequelize);
    }

    const openId = event.queryStringParameters?.openId;
    if (!openId) {
      return badRequest("No user ID provided.");
    }

    const user = await User.findOne({ where: { openId } });
    console.log("USER", user);
    return sendResponseBody({
      status: 200,
      message: "User found",
      success: user,
    });
  } catch (error) {
    return internalServerError(error);
  }
};
