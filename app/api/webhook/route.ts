// import type { NextApiRequest } from "next";
import { NextRequest, NextResponse } from "next/server";
// import { addDocument } from "@/_lib/firebase/firestore";
import { sendMessage } from "../facebook/message/route";
import axios from "axios";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === "page") {
      for (const entry of body.entry) {
        const event = entry.messaging?.[0];
        if (!event) continue;

        const senderId = event.sender?.id;
        const messageText = event.message?.text;
        const is_echo = event.message?.is_echo;

        if (messageText && !is_echo) {
          await sendMessage(
            senderId,
            `Hello, chúng tôi bán trứng, bán rất nhiều trứng`
          );
        }
        if (messageText === "admin" && !is_echo) {
          await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin`,
            { id: senderId },
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", err },
      { status: 400 }
    );
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
    return new Response(challenge ?? "", { status: 200 });
  } else {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}
