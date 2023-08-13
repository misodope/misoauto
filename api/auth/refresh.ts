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
  const handlerResponse: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({ message: "Refresh Endpoint!" }),
  };

  return handlerResponse;
};
