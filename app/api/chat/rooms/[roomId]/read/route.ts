import { readSession } from "@/_lib/auth/session";
import { getRoomRef, mapRoom } from "@/_lib/chat/rooms";
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

export async function POST(
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

  const readAt = Math.max(Date.now(), authorizedRoom.room.lastMessageAt);
  await getRoomRef(roomId).set(
    {
      unreadCounts: {
        [session.username]: 0,
      },
      lastReadAtBy: {
        [session.username]: readAt,
      },
    },
    { merge: true }
  );

  return NextResponse.json({ success: true, readAt });
}
