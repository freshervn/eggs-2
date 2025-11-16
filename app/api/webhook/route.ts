import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Verify token
    const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
      typeof mode === "string" &&
      typeof token === "string" &&
      mode === "subscribe" &&
      token === VERIFY_TOKEN
    ) {
      // challenge can be string or string[] or undefined, handle gracefully
      return res
        .status(200)
        .send(
          typeof challenge === "string"
            ? challenge
            : Array.isArray(challenge)
            ? challenge[0]
            : ""
        );
    } else {
      return res.status(403).send("Forbidden");
    }
  }

  if (req.method === "POST") {
    let body = "";

    // Read raw body
    await new Promise<void>((resolve) => {
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", resolve);
    });

    console.log("WEBHOOK EVENT:", body);

    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(404).send("Not found");
}
