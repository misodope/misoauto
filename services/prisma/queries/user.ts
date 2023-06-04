import { TikTokSuccessResponse } from "../../auth/AuthController.js";
import prisma from "../index.js";
import { add } from "date-fns";

export default class UserQueries {
  async getUser(openId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { openId },
      });

      return user;
    } catch (error) {
      return error;
    }
  }

  async createUser(data: TikTokSuccessResponse) {
    try {
      const user = await prisma.user.create({
        data: {
          openId: data.open_id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
          scope: data.scope,
          refreshExpiresIn: data.refresh_expires_in,
          expiresAt: add(new Date(), { seconds: data.expires_in }),
          refreshExpiresAt: add(new Date(), { seconds: data.expires_in }),
        },
      });

      return user;
    } catch (error) {
      return error;
    }
  }

  async updateUser(openId: string, data: TikTokSuccessResponse) {
    try {
      const user = await prisma.user.update({
        where: { openId },
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
          scope: data.scope,
          refreshExpiresIn: data.refresh_expires_in,
          expiresAt: add(new Date(), { seconds: data.expires_in }),
          refreshExpiresAt: add(new Date(), { seconds: data.expires_in }),
        },
      });

      return user;
    } catch (error) {
      return error;
    }
  }
}
