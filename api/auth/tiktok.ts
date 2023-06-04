import { AuthController } from "../../services/auth/AuthController.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const handler = (_: VercelRequest, res: VercelResponse) => {
  const authController = new AuthController();
  const { url, csrfState } = authController.getAuthorizationUrl();
  const daysToLive = 1;
  const cookieValue = `csrfState=${csrfState}; Secure; HttpOnly; Max-Age=${
    daysToLive * 24 * 60 * 60
  }`;
  res.setHeader("Set-Cookie", cookieValue);
  return res.redirect(url);
};

export default handler;
