import { readSession } from "@/_lib/auth/session";
import { getUserByUsername } from "@/_lib/auth/users";
import {
  ChatRoomSummary,
  ensurePrivateRoom,
  mapRoom,
  PRIVATE_CHAT_ROOMS_COLLECTION,
} from "@/_lib/chat/rooms";
import { admin } from "@/_lib/firebase/Admin";
import { NextRequest, NextResponse } from "next/server";

const db = admin.firestore();

export async function GET() {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roomsSnapshot = await db
      .collection(PRIVATE_CHAT_ROOMS_COLLECTION)
      .where("participantUsernames", "array-contains", session.username)
      .get();

    const rooms = roomsSnapshot.docs
      .map(mapRoom)
      .filter((room): room is ChatRoomSummary => room !== null)
      .sort((left, right) => right.updatedAt - left.updatedAt);

    return NextResponse.json({
      rooms,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load chat rooms.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const targetUsername = String(body?.targetUsername ?? "").trim().toLowerCase();

    if (!targetUsername) {
      return NextResponse.json(
        { error: "Target username is required." },
        { status: 400 }
      );
    }

    if (targetUsername === session.username) {
      return NextResponse.json(
        { error: "You cannot create a room with yourself." },
        { status: 400 }
      );
    }

    const targetUser = await getUserByUsername(targetUsername);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const roomId = await ensurePrivateRoom({
      currentUsername: session.username,
      currentDisplayName: session.displayName,
      otherUsername: targetUser.username,
      otherDisplayName: targetUser.displayName,
    });

    const roomSnapshot = await db
      .collection(PRIVATE_CHAT_ROOMS_COLLECTION)
      .doc(roomId)
      .get();
    const room = mapRoom(roomSnapshot);

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create chat room.",
      },
      { status: 500 }
    );
  }
}
