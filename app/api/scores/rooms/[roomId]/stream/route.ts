import { getRoomRef, mapRoom } from "@/_lib/scores/games";
import { resolvePlayerFromRequest } from "@/_lib/scores/player";
import { createSseEncoder, SSE_HEADERS } from "@/_lib/chat/sse";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;
  const player = await resolvePlayerFromRequest(request);

  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomRef = getRoomRef(roomId);
  const initialSnap = await roomRef.get();
  const initialRoom = mapRoom(initialSnap);

  if (!initialRoom) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!initialRoom.memberUsernames.includes(player.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = createSseEncoder(controller);
      let closed = false;
      let room = initialRoom;

      const publish = () => {
        if (!closed) send({ room });
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(heartbeat);
        controller.close();
      };

      const unsubscribe = roomRef.onSnapshot(
        (snapshot) => {
          const next = mapRoom(snapshot);
          if (next) {
            room = next;
            publish();
          }
        },
        () => cleanup()
      );

      const heartbeat = setInterval(() => {
        if (!closed) send({ type: "heartbeat" });
      }, 15000);

      publish();
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
