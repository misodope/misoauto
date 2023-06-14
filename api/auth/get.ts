import type { VercelRequest, VercelResponse } from "@vercel/node";
import UserQueries from "../../services/prisma/queries/user";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { openId } = req.query as { openId: string };
  if (!openId) {
    return res.status(422).send("No user id provided");
  }

  const userQueries = new UserQueries(prisma);

  try {
    const user = await userQueries.getUser(openId);

    return res.status(200).json(user);
  } catch {
    // Return error message if user is not found
    return res.status(404).send("User not found");
  }
};

export default handler;
