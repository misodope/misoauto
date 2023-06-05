import type { VercelRequest, VercelResponse } from "@vercel/node";
import UserQueries from "../../services/prisma/queries/user.js";
import { PrismaClient, User } from "@prisma/client";

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
  const { openId } = req.query as { openId: string };
  if (!openId) {
    return res.status(422).send("No user id provided");
  }

  const userQueries = new UserQueries(prisma);

  let user: User;
  try {
    user = await userQueries.getUser(openId);
  } catch {
    // Return error message if user is not found
    return res.status(404).send("User not found");
  }

  return res.status(200).json(user);
};

export default handler;
