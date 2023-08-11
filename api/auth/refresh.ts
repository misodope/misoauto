import { Context, APIGatewayEvent, Handler } from "aws-lambda";

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Refresh Endpoint!" }),
  };
};
