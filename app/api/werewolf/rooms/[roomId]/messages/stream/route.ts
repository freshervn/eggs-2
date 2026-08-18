import { resolvePlayerFromRequest } from "@/_lib/scores/player";
import { createSseEncoder, SSE_HEADERS } from "@/_lib/chat/sse";
import {
  canSendChat,
  filterVisibleChatMessages,
  getRoomMessagesCollection,
  mapChatMessage,
  WEREWOLF_CHAT_MESSAGE_LIMIT,
  type WerewolfChatMessage,
} from "@/_lib/werewolf/chat";
import { getRoomRef, mapRoom } from "@/_lib/werewolf/rooms";
import type { WerewolfRoomRecord } from "@/_lib/werewolf/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const player = await resolvePlayerFromRequest(request);
  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const roomRef = getRoomRef(roomId);
  const initialRoom = mapRoom(await roomRef.get());

  if (!initialRoom) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!initialRoom.players.some((entry) => entry.username === player.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = createSseEncoder(controller);
      let closed = false;
      let allMessages: WerewolfChatMessage[] = [];
      let room: WerewolfRoomRecord = initialRoom;
      let canSend = false;
      let sendBlockedReason = "";
      let channel: string | null = null;

      const publish = () => {
        if (closed) return;
        send({
          messages: filterVisibleChatMessages(room, player.username, allMessages),
          canSend,
          sendBlockedReason,
          channel,
        });
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribeMessages();
        unsubscribeRoom();
        clearInterval(heartbeat);
        controller.close();
      };

      const unsubscribeMessages = getRoomMessagesCollection(roomId)
        .orderBy("createdAt", "desc")
        .limit(WEREWOLF_CHAT_MESSAGE_LIMIT)
        .onSnapshot(
          (snapshot) => {
            allMessages = snapshot.docs.map(mapChatMessage).reverse();
            publish();
          },
          () => cleanup()
        );

      const unsubscribeRoom = roomRef.onSnapshot(
        (snapshot) => {
          const nextRoom = mapRoom(snapshot);
          if (!nextRoom) return;
          room = nextRoom;
          const chat = canSendChat(room, player.username);
          canSend = chat.allowed;
          sendBlockedReason = chat.reason;
          channel = chat.channel;
          publish();
        },
        () => cleanup()
      );

      const heartbeat = setInterval(() => {
        if (!closed) send({ type: "heartbeat" });
      }, 15000);

      const initialChat = canSendChat(initialRoom, player.username);
      canSend = initialChat.allowed;
      sendBlockedReason = initialChat.reason;
      channel = initialChat.channel;

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
