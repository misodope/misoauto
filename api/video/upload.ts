import {
  badRequest,
  internalServerError,
  sendResponseBody,
} from "../../services/utils/response";

import {
  Context,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../", ".env") });

const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB

export const handler: Handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<{
    filename: string;
    filesize: string;
  }>,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    const requestBody = JSON.parse(event.body);
    const { filename, filesize } = requestBody;

    const REGION = process.env.LAMBDA_AWS_REGION;
    const ACCESS_KEY_ID = process.env.LAMBDA_AWS_ACCESS_KEY;
    const SECRET_ACCESS_KEY = process.env.LAMBDA_AWS_SECRET_ACCESS_KEY;

    const s3Client = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });

    const putObjectCommand = new PutObjectCommand({
      Bucket: "misoauto",
      Key: `videos/${filename}`,
    });

    const url = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 3600,
    });

    return sendResponseBody({
      status: 200,
      message: "Successfully Uploaded Video.",
      success: {
        signedUrl: url,
      },
    });
  } catch (error) {
    return internalServerError(error);
  }
};

// (async () => {
//   const REGION = process.env.AWS_REGION;
//   const ACCESS_KEY_ID = process.env.LAMBDA_AWS_ACCESS_KEY;
//   const SECRET_ACCESS_KEY = process.env.LAMBDA_AWS_SECRET_ACCESS_KEY;

//   const s3Client = new S3Client({
//     region: REGION,
//     credentials: {
//       accessKeyId: ACCESS_KEY_ID,
//       secretAccessKey: SECRET_ACCESS_KEY,
//     },
//   });

//   const putObjectCommand = new PutObjectCommand({
//     Bucket: "misoauto",
//     Key: "videos/test.txt",
//     Body: JSON.stringify({
//       ligma: "balls",
//       sugundese: "nuts",
//     }),
//   });
//   const putResponse = await s3Client.send(putObjectCommand);
//   console.log("Uploaded File", putResponse);

//   const listCommand = new ListObjectsCommand({ Bucket: "misoauto" });
//   const listResponse = await s3Client.send(listCommand);
//   console.log("Objects", listResponse);
// })();
