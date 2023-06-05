import {
  AuthController,
  TikTokSuccessResponse,
} from "../../services/auth/AuthController.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import UserQueries from "../../services/prisma/queries/user.js";
import {
  getCurrentRequestEnv,
  getRedirectUrl,
} from "../../services/utils/env.js";

import { PrismaClient } from "@prisma/client";
import { User } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e: any) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
  console.log("------------------------------------------------------");
});

prisma.$on("beforeExit", (e: any) => {
  console.log("beforeExit hook", e);
});

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { code, state } = req.query as { code: string; state: string };
  const { csrfState } = req.cookies;
  if (state !== csrfState) {
    res.status(422).send("Invalid state");
    return;
  }

  let user: User;
  try {
    const authController = new AuthController();
    const userQueries = new UserQueries(prisma);
    const currentEnv = getCurrentRequestEnv(req);
    const redirectUri = getRedirectUrl(currentEnv);

    const response: TikTokSuccessResponse = await authController.getAccessToken(
      code,
      redirectUri
    );

    user = await userQueries.getUser(response.open_id);

    if (!user) {
      user = await userQueries.createUser(response);
    } else {
      user = await userQueries.updateUser(response.open_id, response);
    }
  } catch (error) {
    console.error(error);
  }

  return res.redirect(`/dashboard/?user=${user.openId}`);
};

export default handler;
