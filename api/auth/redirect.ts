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

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { code, state } = req.query as { code: string; state: string };
  const { csrfState } = req.cookies;
  if (state !== csrfState) {
    res.status(422).send("Invalid state");
    return;
  }

  try {
    const authController = new AuthController();
    const userQueries = new UserQueries();
    const currentEnv = getCurrentRequestEnv(req);
    const redirectUri = getRedirectUrl(currentEnv);

    const response: TikTokSuccessResponse = await authController.getAccessToken(
      code,
      redirectUri
    );
    console.log("This is response in redirect: ", response);
    const user = await userQueries.getUser(response.open_id);
    console.log("This is user: ", user);
    if (!user) {
      await userQueries.createUser(response);
    } else {
      await userQueries.updateUser(response.open_id, response);
    }
  } catch (error) {
    console.error(error);
  }

  return res.redirect("/dashboard");
};

export default handler;
