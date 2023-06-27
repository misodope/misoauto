import { TikTokSuccessResponse } from "../../api/AuthController.js";
import { add } from "date-fns";

import { PrismaClient, User } from "@prisma/client";

export default class UserQueries {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getUser(openId: string): Promise<User> {
    try {
      const user = this.prisma.user.findUnique({
        where: { openId },
      });

      return user;
    } catch (error) {
      return error;
    }
  }

  async createUser(data: TikTokSuccessResponse) {
    try {
      const user = await this.prisma.user.create({
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
      const user = await this.prisma.user.update({
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
