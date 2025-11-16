// import type { NextApiRequest } from "next";
import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextApiRequest) {
//   let body = "";

//   // Read raw body
//   await new Promise<void>((resolve) => {
//     req.on("data", (chunk: Buffer) => {
//       body += chunk.toString();
//     });
//     req.on("end", resolve);
//   });

//   console.log("WEBHOOK EVENT:", body);

//   return NextResponse.json({ message: "EVENT_RECEIVED" }, { status: 200 });
// }
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
    return NextResponse.json(
      {
        message:
          typeof challenge === "string"
            ? challenge
            : Array.isArray(challenge)
            ? challenge[0]
            : "",
      },
      { status: 200 }
    );
  } else {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}
