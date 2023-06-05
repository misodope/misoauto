import { VercelRequest, VercelResponse } from "@vercel/node";

const handler = (_: VercelRequest, res: VercelResponse) => {
  console.log("hello refreshing...");
  return res.send("Hello World");
};

export default handler;
