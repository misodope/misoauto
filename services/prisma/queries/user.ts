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
        where: { open_id: openId },
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
          open_id: data.open_id,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expire_in: data.expires_in,
          scope: data.scope,
          refresh_expires_in: data.refresh_expires_in,
          expires_at: add(new Date(), { seconds: data.expires_in }),
          refresh_expires_at: add(new Date(), { seconds: data.expires_in }),
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
        where: { open_id: openId },
        data: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expire_in: data.expires_in,
          scope: data.scope,
          refresh_expires_in: data.refresh_expires_in,
          expires_at: add(new Date(), { seconds: data.expires_in }),
          refresh_expires_at: add(new Date(), { seconds: data.expires_in }),
        },
      });

      return user;
    } catch (error) {
      return error;
    }
  }
}
