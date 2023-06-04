import {
  AuthController,
  TikTokSuccessResponse,
} from "../../services/auth/AuthController.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../services/prisma/index.js";
import { add } from "date-fns";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { code, state } = req.query as { code: string; state: string };
  const { csrfState } = req.cookies;
  if (state !== csrfState) {
    res.status(422).send("Invalid state");
    return;
  }

  try {
    const authController = new AuthController();
    const response: TikTokSuccessResponse = await authController.getAccessToken(
      code
    );
    console.log("response", response);
    // use prisma and check if user already exists in db otherwise create new user
    await prisma.$connect();
    console.log("AFTER CONNECT", prisma);

    let user = await prisma.user.findUnique({
      where: { openId: response.open_id },
    });

    console.log("HELLLOOO", user);
    await prisma.$disconnect();
    // if (user) {
    //   user = await prisma.user.update({
    //     where: { openId: response.open_id },
    //     data: {
    //       accessToken: response.access_token,
    //       refreshToken: response.refresh_token,
    //       expiresIn: response.expires_in,
    //       scope: response.scope,
    //       refreshExpiresIn: response.refresh_expires_in,
    //       expiresAt: add(new Date(), { seconds: response.expires_in }),
    //       refreshExpiresAt: add(new Date(), { seconds: response.expires_in }),
    //     },
    //   });
    // } else {
    //   user = await prisma.user.create({
    //     data: {
    //       openId: response.open_id,
    //       accessToken: response.access_token,
    //       refreshToken: response.refresh_token,
    //       expiresIn: response.expires_in,
    //       scope: response.scope,
    //       refreshExpiresIn: response.refresh_expires_in,
    //     },
    //   });
    // }
    // console.log("USER", user);
  } catch (error) {
    console.error(error);
  }

  return res.redirect("/dashboard");
};

export default handler;
