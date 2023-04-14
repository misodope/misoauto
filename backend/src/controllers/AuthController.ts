import { Request, Response } from "express";
import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

interface TikTokResponse {
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    open_id: string;
    scope: string;
    refresh_expires_in: number;
  };
}

export interface RequestSession extends Request {
  session: {
    csrfState: string;
  };
}

const prisma = new PrismaClient();

export class AuthController {
  async getAuthorizationCode(req: RequestSession, res: Response) {
    // Generate a random string for the state parameter to prevent CSRF
    const csrfState = Math.random().toString(36).substring(2);
    req.session.csrfState = csrfState;

    let url = "https://www.tiktok.com/auth/authorize/";
    url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    url += "&scope=user.info.basic,video.list";
    url += "&response_type=code";
    url += `&redirect_uri=https://misoauto.up.railway.app/oauth/redirect`;
    url += "&state=" + csrfState;

    res.redirect(url);
  }

  // Get the access token
  async getAccessToken(req: RequestSession, res: Response) {
    const { code, state } = req.query;
    const { csrfState } = req.session;
    console.log("State: ", state);
    console.log("CSRF State: ", csrfState);
    // if (state !== csrfState) {
    //   res.status(422).send("Invalid state");
    //   return;
    // }

    const url = "https://open-api.tiktok.com/oauth/access_token/";
    const body = {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { data } = (await response.json()) as TikTokResponse;
        // Check if user exists in database
        const user = await prisma.user.findUnique({
          where: { openId: data.open_id },
        });

        if (!user) {
          // If user doesn't exist, create a new user
          await prisma.user.create({
            data: {
              openId: data.open_id,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: data.expires_in,
              scope: data.scope,
              refreshExpiresIn: data.refresh_expires_in,
            },
          });
        } else {
          // If user exists, update the user with the new access token
          await prisma.user.update({
            where: { openId: data.open_id },
            data: {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: data.expires_in,
              scope: data.scope,
              refreshExpiresIn: data.refresh_expires_in,
            },
          });
        }

        res.redirect("https://misoauto.vercel.app/dashboard");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getRefreshToken(req: RequestSession, res: Response) {
    const { refresh_token } = req.query;

    const url = "https://open-api.tiktok.com/oauth/access_token/";
    const body = {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        res.send(data);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
