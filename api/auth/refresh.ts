import { sendResponseBody } from "@services/utils/response";
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

  return sendResponseBody({
    status: 200,
    message: "Refresh Endpoint!",
    success: {},
  });
};
