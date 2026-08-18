import { resolvePlayerFromBody, resolvePlayerFromRequest } from "@/_lib/scores/player";
import {
  canSendChat,
  filterVisibleChatMessages,
  getRoomMessagesCollection,
  mapChatMessage,
  WEREWOLF_CHAT_MAX_LENGTH,
  WEREWOLF_CHAT_MESSAGE_LIMIT,
} from "@/_lib/werewolf/chat";
import { getRoomRef, mapRoom } from "@/_lib/werewolf/rooms";
import { NextRequest, NextResponse } from "next/server";

const getAuthorizedRoom = async (roomId: string, username: string) => {
  const room = mapRoom(await getRoomRef(roomId).get());
  if (!room) {
    return { room: null, error: "Not found", status: 404 };
  }
  if (!room.players.some((player) => player.username === username)) {
    return { room: null, error: "Forbidden", status: 403 };
  }
  return { room, error: null, status: 200 };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const player = await resolvePlayerFromRequest(request);
  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const authorized = await getAuthorizedRoom(roomId, player.username);
  if (!authorized.room) {
    return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  }

  const snapshot = await getRoomMessagesCollection(roomId)
    .orderBy("createdAt", "desc")
    .limit(WEREWOLF_CHAT_MESSAGE_LIMIT)
    .get();

  const messages = filterVisibleChatMessages(
    authorized.room,
    player.username,
    snapshot.docs.map(mapChatMessage).reverse()
  );
  const chat = canSendChat(authorized.room, player.username);

  return NextResponse.json({
    messages,
    canSend: chat.allowed,
    sendBlockedReason: chat.reason,
    channel: chat.channel,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const player = await resolvePlayerFromBody(body);
  if (!player) {
    return NextResponse.json(
      { error: "Nhập tên của bạn để tiếp tục." },
      { status: 401 }
    );
  }

  const { roomId } = await context.params;
  const authorized = await getAuthorizedRoom(roomId, player.username);
  if (!authorized.room) {
    return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  }

  const chat = canSendChat(authorized.room, player.username);
  if (!chat.allowed || !chat.channel) {
    return NextResponse.json({ error: chat.reason }, { status: 400 });
  }

  const text = String(body?.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Tin nhắn trống." }, { status: 400 });
  }
  if (text.length > WEREWOLF_CHAT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Tối đa ${WEREWOLF_CHAT_MAX_LENGTH} ký tự.` },
      { status: 400 }
    );
  }

  const createdAt = Date.now();
  const messageRef = await getRoomMessagesCollection(roomId).add({
    text,
    username: player.username,
    displayName: player.displayName,
    channel: chat.channel,
    createdAt,
  });

  return NextResponse.json(
    {
      message: {
        id: messageRef.id,
        text,
        username: player.username,
        displayName: player.displayName,
        channel: chat.channel,
        createdAt,
      },
    },
    { status: 201 }
  );
}
