import {
  badRequest,
  internalServerError,
  sendResponseBody,
} from "@services/utils/response.js";
import {
  Context,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<{ file: File }>,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    return sendResponseBody({
      status: 200,
      message: "Successfully Uploaded Video.",
    });
  } catch (error) {
    return internalServerError(error);
  }
};
