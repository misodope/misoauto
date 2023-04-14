import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { resolvers } from "./resolvers/index.js";
import path from "path";
import fs from "fs";
import https from "https";
import { AuthController } from "./controllers/AuthController.js";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    csrfState: string;
  }
}

const app = express();
const { json } = bodyParser;
// Path to the .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.join(__dirname, "..", "..", ".env");
// Get the private key and certificate for HTTPS
let httpsServer: https.Server;
if (process.env.NODE_ENV !== "production") {
  const key = fs.readFileSync(
    path.resolve(__dirname, "bin/localhost-key.pem"),
    "utf-8"
  );
  const cert = fs.readFileSync(
    path.resolve(__dirname, "bin/localhost.pem"),
    "utf-8"
  );

  httpsServer = https.createServer({ key, cert }, app);
}

const httpServer = http.createServer(app);

const schemaPaths = [
  fileURLToPath(new URL("./schema/hello.graphql", import.meta.url)),
];
const schema = loadSchemaSync(schemaPaths, {
  loaders: [new GraphQLFileLoader()],
});

const main = async () => {
  config({ path: envFilePath });

  const server = new ApolloServer({
    schema: makeExecutableSchema({ typeDefs: schema, resolvers }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: true,
        maxAge: 3600000, // Time is in miliseconds
      },
      resave: false,
      saveUninitialized: true,
    })
  );
  app.use(cors<cors.CorsRequest>());
  app.use(json());
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );

  const authController = new AuthController();
  app.get("/oauth/tiktok", authController.getAuthorizationCode);
  app.get("/oauth/redirect", authController.getAccessToken);
  app.get("/oauth/refresh", authController.getRefreshToken);

  if (process.env.NODE_ENV !== "production") {
    await new Promise<void>((resolve) => {
      httpsServer.listen({ port: 8080 }, () => {
        console.log(`🚀 Server ready at https://localhost:8080/graphql`);

        resolve();
      });
    });
  }

  await new Promise<void>((resolve) => {
    httpServer.listen({ port: 8000 }, () => {
      console.log(`🚀 Server ready at http://localhost:8000/graphql`);

      resolve();
    });
  });
};

main().catch((error) => console.error(error));
