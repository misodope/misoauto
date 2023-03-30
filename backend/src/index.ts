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
import { resolvers } from "./resolvers/index.js";

const app = express();
const httpServer = http.createServer(app);
const { json } = bodyParser;
const PORT = 8000;

const schemaPaths = [
  fileURLToPath(new URL("./schema/hello.graphql", import.meta.url)),
];
const schema = loadSchemaSync(schemaPaths, {
  loaders: [new GraphQLFileLoader()],
});

const main = async () => {
  const server = new ApolloServer({
    schema: makeExecutableSchema({ typeDefs: schema, resolvers }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);

      resolve();
    })
  );
};

main().catch((error) => console.error(error));
