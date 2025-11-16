// import type { NextApiRequest } from "next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Webhook Event:", JSON.stringify(body, null, 2));

    // Example: handling incoming messages
    if (body.object === "page") {
      body.entry.forEach(
        (entry: {
          messaging: Array<{
            sender: { id: string };
            message?: { text?: string };
          }>;
        }) => {
          const messagingEvents = entry.messaging;
          messagingEvents.forEach(
            (event: {
              sender: { id: string };
              message?: { text?: string };
            }) => {
              if (event.message && event.sender) {
                const senderId = event.sender.id;
                const messageText = event.message.text;
                console.log(`Message from ${senderId}: ${messageText}`);
                // Here you can reply via Page Access Token API
              }
            }
          );
        }
      );
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    typeof mode === "string" &&
    typeof token === "string" &&
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    // challenge can be string or string[] or undefined, handle gracefully
    return new NextResponse(challenge, { status: 200 });
  } else {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}
