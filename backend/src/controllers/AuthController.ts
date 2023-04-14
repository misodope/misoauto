import { Request, Response } from "express";
import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

interface TikTokResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
  refresh_expires_in: number;
}

export class AuthController {
  prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAuthorizationCode(_: Request, res: Response) {
    // Generate a random string for the state parameter to prevent CSRF
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie("", csrfState, { maxAge: 60000 });

    let url = "https://www.tiktok.com/auth/authorize/";
    url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    url += "&scope=user.info.basic,video.list";
    url += "&response_type=code";
    url += `&redirect_uri=https://misoauto.up.railway.app/oauth/redirect`;
    url += "&state=" + csrfState;

    res.redirect(url);
  }

  // Get the access token
  async getAccessToken(req: Request, res: Response) {
    const { code, state } = req.query;
    // TODO: Figure out how to set csrfState in cookie since it's coming from a different domain.
    // Setting the cookie currently in the above won't work as it sets for the current domain: misoauto.up.railway.app
    // const { csrfState } = req.cookies;
    console.log("Cookies", req.cookies);
    console.log("STate", state);
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
        const data = (await response.json()) as TikTokResponse;
        console.log("Access Token TikTok Data: ", data);
        // Check if user exists in database
        const user = await this.prisma.user.findUnique({
          where: { openId: data.open_id },
        });
        console.log("User: ", user);
        // If user doesn't exist, create a new user
        if (!user) {
          await this.prisma.user.create({
            data: {
              openId: data.open_id,
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

  async getRefreshToken(req: Request, res: Response) {
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
