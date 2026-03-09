import { readSession } from "@/_lib/auth/session";
import { ChatRoomSummary, mapRoom, PRIVATE_CHAT_ROOMS_COLLECTION } from "@/_lib/chat/rooms";
import { createSseEncoder, SSE_HEADERS } from "@/_lib/chat/sse";
import { admin } from "@/_lib/firebase/Admin";
import { NextRequest, NextResponse } from "next/server";

const db = admin.firestore();

export async function GET(request: NextRequest) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = createSseEncoder(controller);
      let closed = false;

      const cleanup = () => {
        if (closed) {
          return;
        }

        closed = true;
        unsubscribeRooms();
        clearInterval(heartbeat);
        controller.close();
      };

      const unsubscribeRooms = db
        .collection(PRIVATE_CHAT_ROOMS_COLLECTION)
        .where("participantUsernames", "array-contains", session.username)
        .onSnapshot(
          (snapshot) => {
            const rooms = snapshot.docs
              .map(mapRoom)
              .filter((room): room is ChatRoomSummary => room !== null)
              .sort((left, right) => right.updatedAt - left.updatedAt);

            if (!closed) {
              send({ rooms });
            }
          },
          (error) => {
            if (!closed) {
              send({
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to stream rooms.",
              });
            }
            cleanup();
          }
        );

      const heartbeat = setInterval(() => {
        if (!closed) {
          send({ type: "heartbeat" });
        }
      }, 15000);

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}
