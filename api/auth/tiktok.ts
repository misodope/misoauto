import { getCurrentRequestEnv, getRedirectUrl } from "../../services/utils/env";
import { AuthController } from "../../services/api/AuthController";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const handler = (req: VercelRequest, res: VercelResponse) => {
  const authController = new AuthController();
  const currentEnv = getCurrentRequestEnv(req);
  const redirectUri = getRedirectUrl(currentEnv);
  const { url, csrfState } = authController.getAuthorizationUrl(redirectUri);

  const daysToLive = 1;
  const cookieValue = `csrfState=${csrfState}; Secure; HttpOnly; Max-Age=${
    daysToLive * 24 * 60 * 60
  }`;

  res.setHeader("Set-Cookie", cookieValue);

  return res.redirect(url);
};

export default handler;
