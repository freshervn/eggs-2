import { readSession } from "@/_lib/auth/session";
import {
  getRoomMessagesCollection,
  getRoomRef,
  getRoomTypingCollection,
  mapMessage,
  mapRoom,
  mapTypingUser,
  PRIVATE_CHAT_MESSAGE_LIMIT,
  PRIVATE_CHAT_TYPING_TTL_MS,
} from "@/_lib/chat/rooms";
import { NextRequest, NextResponse } from "next/server";

const getAuthorizedRoom = async (roomId: string, username: string) => {
  const roomSnapshot = await getRoomRef(roomId).get();
  const room = mapRoom(roomSnapshot);

  if (!room) {
    return { room: null, error: "Room not found.", status: 404 };
  }

  if (!room.participantUsernames.includes(username)) {
    return { room: null, error: "Forbidden", status: 403 };
  }

  return { room, error: null, status: 200 };
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const authorizedRoom = await getAuthorizedRoom(roomId, session.username);

  if (!authorizedRoom.room) {
    return NextResponse.json(
      { error: authorizedRoom.error },
      { status: authorizedRoom.status }
    );
  }

  try {
    const [messagesSnapshot, typingSnapshot] = await Promise.all([
      getRoomMessagesCollection(roomId)
        .orderBy("createdAt", "desc")
        .limit(PRIVATE_CHAT_MESSAGE_LIMIT)
        .get(),
      getRoomTypingCollection(roomId).get(),
    ]);

    const messages = messagesSnapshot.docs.map(mapMessage).reverse();
    const typingUsers = typingSnapshot.docs
      .map(mapTypingUser)
      .filter(
        (user) =>
          user.username !== session.username &&
          Date.now() - user.updatedAt <= PRIVATE_CHAT_TYPING_TTL_MS
      );

    return NextResponse.json({
      messages,
      room: authorizedRoom.room,
      typingUsers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load messages.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const authorizedRoom = await getAuthorizedRoom(roomId, session.username);

  if (!authorizedRoom.room) {
    return NextResponse.json(
      { error: authorizedRoom.error },
      { status: authorizedRoom.status }
    );
  }

  try {
    const body = await request.json();
    const text = String(body?.text ?? "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Message text is required." },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Message must be 500 characters or less." },
        { status: 400 }
      );
    }

    const createdAt = Date.now();
    const nextUnreadCounts = Object.fromEntries(
      authorizedRoom.room.participantUsernames.map((username) => [
        username,
        username === session.username
          ? 0
          : (authorizedRoom.room?.unreadCounts?.[username] ?? 0) + 1,
      ])
    );
    const nextLastReadAtBy = {
      ...authorizedRoom.room.lastReadAtBy,
      [session.username]: createdAt,
    };
    const messageRef = await getRoomMessagesCollection(roomId).add({
      text,
      username: session.username,
      displayName: session.displayName,
      createdAt,
    });

    await getRoomRef(roomId).set(
      {
        updatedAt: createdAt,
        lastMessageText: text,
        lastMessageAt: createdAt,
        unreadCounts: nextUnreadCounts,
        lastReadAtBy: nextLastReadAtBy,
      },
      { merge: true }
    );

    await getRoomTypingCollection(roomId).doc(session.username).delete().catch(() => {});

    return NextResponse.json(
      {
        message: {
          id: messageRef.id,
          text,
          username: session.username,
          displayName: session.displayName,
          createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message.",
      },
      { status: 500 }
    );
  }
}
