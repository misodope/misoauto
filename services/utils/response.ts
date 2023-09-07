import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

interface IResponse {
  status: number;
  error?: {} | null;
  message: string;
  success: {} | null;
  cookies?: Array<string>;
  headers?: {};
}

export const sendResponseBody = ({
  error = null,
  message,
  status,
  success = null,
  headers,
  cookies = [],
}: IResponse): APIGatewayProxyStructuredResultV2 => {
  const defaultHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Credentials": true,
    ...(headers ? headers : {}),
  };

  return {
    statusCode: status,
    cookies: [...cookies],
    headers: defaultHeaders,
    body: JSON.stringify(
      {
        message,
        response: error ? error : success,
      },
      null,
      2,
    ),
  };
};

export const internalServerError = (error: any) => {
  console.log(error);

  let message = "Internal Server Error";

  //Attempt to give a better response message
  if (error?.errors && error?.errors.length) {
    message = `${error?.errors[0]?.message?.toUpperCase()}. Please check ${error
      ?.errors[0]?.value}`;
  }

  return sendResponseBody({
    error,
    message,
    status: 500,
    success: null,
  });
};

export const badRequest = (message: string) => {
  return sendResponseBody({
    message,
    status: 400,
    success: null,
    error: null,
  });
};
