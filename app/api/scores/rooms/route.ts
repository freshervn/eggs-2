import { getUserByUsername } from "@/_lib/auth/users";
import { resolvePlayerFromBody } from "@/_lib/scores/player";
import {
  createUniqueInviteCode,
  mapRoom,
  SCORE_ROOMS_COLLECTION,
} from "@/_lib/scores/games";
import { admin } from "@/_lib/firebase/Admin";
import { readSession } from "@/_lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

const db = admin.firestore();

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await db
    .collection(SCORE_ROOMS_COLLECTION)
    .where("memberUsernames", "array-contains", session.username)
    .get();

  const rooms = snapshot.docs
    .map(mapRoom)
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return NextResponse.json({ rooms });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const player = await resolvePlayerFromBody(body);

  if (!player) {
    return NextResponse.json(
      { error: "Nhập tên của bạn để tiếp tục." },
      { status: 401 }
    );
  }

  const name = String(body?.name ?? "").trim() || "Phòng điểm";
  const inviteUsername = String(body?.inviteUsername ?? "").trim().toLowerCase();

  const inviteCode = await createUniqueInviteCode();
  const now = Date.now();

  const members = [
    {
      username: player.username,
      displayName: player.displayName,
      score: 0,
    },
  ];
  const memberUsernames = [player.username];

  if (!player.isGuest && inviteUsername && inviteUsername !== player.username) {
    const invited = await getUserByUsername(inviteUsername);
    if (invited) {
      members.push({
        username: invited.username,
        displayName: invited.displayName,
        score: 0,
      });
      memberUsernames.push(invited.username);
    }
  }

  const docRef = await db.collection(SCORE_ROOMS_COLLECTION).add({
    name,
    inviteCode,
    hostUsername: player.username,
    hostDisplayName: player.displayName,
    memberUsernames,
    members,
    createdAt: now,
    updatedAt: now,
  });

  const room = mapRoom(await docRef.get());
  return NextResponse.json({ room }, { status: 201 });
}
