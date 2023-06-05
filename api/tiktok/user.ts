import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TikTokController } from "../../services/api/TikTokController.js";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const tiktokController = new TikTokController();
  const { accessToken } = req.body as { accessToken: string };
  if (!accessToken) {
    return res.status(422).send("No token provided");
  }

  try {
    const userInfo = await tiktokController.getUserInfo(accessToken);
    return res.status(200).json(userInfo);
  } catch {
    // Return error message if user is not found
    return res.status(404).send("User not found");
  }
};

export default handler;
