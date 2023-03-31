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

const app = express();
const httpServer = http.createServer(app);
const { json } = bodyParser;
const PORT = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.join(__dirname, "..", "..", ".env");

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

  app.use(cors<cors.CorsRequest>());
  app.use(json());
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );
  app.get("/oauth/tiktok", (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie("csrfState", csrfState, { maxAge: 60000 });

    let url = "https://www.tiktok.com/auth/authorize/";
    url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    url += "&scope=user.info.basic,video.list";
    url += "&response_type=code";
    url += "&redirect_uri=misoauto.vercel.app";
    url += "&state=" + csrfState;

    res.redirect(url);
  });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);

      resolve();
    })
  );
};

main().catch((error) => console.error(error));
