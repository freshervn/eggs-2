import { resolvePlayerFromBody } from "@/_lib/scores/player";
import { defaultRowColorForIndex, mapRoom, SCORE_ROOMS_COLLECTION, serializeRoomMembers } from "@/_lib/scores/games";
import { admin } from "@/_lib/firebase/Admin";
import { NextRequest, NextResponse } from "next/server";

const db = admin.firestore();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const player = await resolvePlayerFromBody(body);

  if (!player) {
    return NextResponse.json(
      { error: "Nhập tên của bạn để tiếp tục." },
      { status: 401 }
    );
  }

  const inviteCode = String(body?.inviteCode ?? "")
    .trim()
    .toUpperCase();

  if (!inviteCode) {
    return NextResponse.json({ error: "Mã mời không hợp lệ." }, { status: 400 });
  }

  const snapshot = await db
    .collection(SCORE_ROOMS_COLLECTION)
    .where("inviteCode", "==", inviteCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return NextResponse.json({ error: "Không tìm thấy phòng." }, { status: 404 });
  }

  const doc = snapshot.docs[0];
  const room = mapRoom(doc);

  if (!room) {
    return NextResponse.json({ error: "Không tìm thấy phòng." }, { status: 404 });
  }

  if (room.memberUsernames.includes(player.username)) {
    const members = room.members.map((m) =>
      m.username === player.username
        ? { ...m, displayName: player.displayName }
        : m
    );
    if (members.some((m, i) => m.displayName !== room.members[i]?.displayName)) {
      await doc.ref.update({
        members: serializeRoomMembers(members),
        updatedAt: Date.now(),
      });
      return NextResponse.json({ room: mapRoom(await doc.ref.get()) });
    }
    return NextResponse.json({ room });
  }

  const now = Date.now();
  await doc.ref.update({
    memberUsernames: [...room.memberUsernames, player.username],
    members: serializeRoomMembers([
      ...room.members,
      {
        username: player.username,
        displayName: player.displayName,
        score: 0,
        roundScore: 0,
        rowColor: defaultRowColorForIndex(room.members.length),
      },
    ]),
    updatedAt: now,
  });

  const updated = mapRoom(await doc.ref.get());
  return NextResponse.json({ room: updated });
}
