import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TikTokController } from "../../services/api/TikTokController.js";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const tiktokController = new TikTokController();
  const { accessToken } = req.body as { accessToken: string };
  if (!accessToken) {
    return res.status(422).send("No token provided");
  }

  try {
    const videoListResponse = await tiktokController.getVideos(accessToken);

    return res.status(200).json(videoListResponse);
  } catch (error) {
    console.error(error);
    return res.status(404).send("Sorry, we're having trouble fetching videos");
  }
};

export default handler;
