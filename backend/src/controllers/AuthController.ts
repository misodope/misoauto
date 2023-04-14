import { Request, Response } from "express";
import fetch from "node-fetch";

export class AuthController {
  async getAuthorizationCode(_: Request, res: Response) {
    // Generate a random string for the state parameter to prevent CSRF
    // const csrfState = Math.random().toString(36).substring(2);
    // res.cookie("csrfState", csrfState, { maxAge: 60000 });
    // let url = "https://www.tiktok.com/auth/authorize/";
    // url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    // url += "&scope=user.info.basic,video.list";
    // url += "&response_type=code";
    // url += `&redirect_uri=https://misoauto.up.railway.app/oauth/redirect`;
    // url += "&state=" + csrfState;
    // // Add the 'Access-Control-Allow-Origin' header to allow requests from all domains
    // res.setHeader("Access-Control-Allow-Origin", "*");
    // res.redirect(url);
    res.send("TESTTTT");
  }

  // Get the access token
  async getAccessToken(req: Request, res: Response) {
    const { code, state } = req.query;
    // const { csrfState } = req.cookies;

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
        const data = await response.json();
        res.send(data);
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
