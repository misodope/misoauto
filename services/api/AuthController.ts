export interface TikTokSuccessResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
  refresh_expires_in: number;
  token_type: string;
}

interface TikTokErrorResponse {
  error: string;
  error_description: string;
  log_id: string;
}

export class AuthController {
  getAuthorizationUrl(redirectUri: string) {
    // Generate a random string for the state parameter to prevent CSRF
    const csrfState = Math.random().toString(36).substring(2);

    let url = "https://www.tiktok.com/v2/auth/authorize/";
    url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    url += "&scope=user.info.basic,video.list,video.upload,user.info.stats";
    url += "&response_type=code";
    url += `&redirect_uri=${redirectUri}`;
    url += "&state=" + csrfState;

    return {
      url,
      csrfState,
    };
  }

  async getAccessToken(
    code: string,
    redirectUri: string,
  ): Promise<TikTokSuccessResponse> {
    const url = "https://open.tiktokapis.com/v2/oauth/token/";
    const body = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    });
    const fetchConfig = {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
    };

    try {
      const response = await fetch(url, fetchConfig);

      if (response.ok) {
        const data: TikTokSuccessResponse & TikTokErrorResponse =
          await response.json();

        if (data.error) {
          throw Error(
            `Error fetching access token! error: ${data.error}, message: ${data.error_description}`,
          );
        }

        return data;
      }
    } catch (error) {
      return error;
    }
  }

  // async getRefreshToken(req: Request, res: VercelResponse) {
  //   const { refresh_token } = req.query;

  //   const url = "https://open-api.tiktok.com/oauth/access_token/";
  //   const body = {
  //     client_key: process.env.TIKTOK_CLIENT_KEY,
  //     client_secret: process.env.TIKTOK_CLIENT_SECRET,
  //     grant_type: "refresh_token",
  //     refresh_token,
  //   };

  //   try {
  //     const response = await fetch(url, {
  //       method: "POST",
  //       body: JSON.stringify(body),
  //       headers: { "Content-Type": "application/json" },
  //     });

  //     if (response.ok) {
  //       const { data } = (await response.json()) as TikTokResponse;

  //       await prisma.user.update({
  //         where: { openId: data.open_id },
  //         data: {
  //           accessToken: data.access_token,
  //           refreshToken: data.refresh_token,
  //           expiresIn: data.expires_in,
  //           scope: data.scope,
  //           refreshExpiresIn: data.refresh_expires_in,
  //         },
  //       });

  //       res.redirect("https://misoauto.vercel.app/dashboard");
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // async logout(req: Request, res: VercelResponse, next: NextFunction) {
  //   req.session.destroy((err) => {
  //     if (err) next(err);

  //     req.session.regenerate((err) => {
  //       if (err) next(err);

  //       res.redirect("https://misoauto.vercel.app/");
  //     });
  //   });
  // }
}
