import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";

const handler = (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback
) => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ message: "Refresh Endpoint!" }),
  });
};

export default handler;
