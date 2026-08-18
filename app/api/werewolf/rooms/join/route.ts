import { resolvePlayerFromBody } from "@/_lib/scores/player";
import { resolveWerewolfAvatarFromBody } from "@/_lib/werewolf/avatar-input";
import { mapRoom, serializePlayers } from "@/_lib/werewolf/rooms";
import { WEREWOLF_ROOMS_COLLECTION } from "@/_lib/werewolf/game";
import { admin } from "@/_lib/firebase/Admin";
import { NextRequest, NextResponse } from "next/server";

const db = admin.firestore();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
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
  const { avatarId, avatarUrl } = resolveWerewolfAvatarFromBody(body, player.username);

  if (!inviteCode) {
    return NextResponse.json({ error: "Nhập mã phòng." }, { status: 400 });
  }

  const snapshot = await db
    .collection(WEREWOLF_ROOMS_COLLECTION)
    .where("inviteCode", "==", inviteCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return NextResponse.json({ error: "Không tìm thấy phòng." }, { status: 404 });
  }

  const roomDoc = snapshot.docs[0];
  const room = mapRoom(roomDoc);

  if (!room) {
    return NextResponse.json({ error: "Phòng không hợp lệ." }, { status: 404 });
  }

  if (room.phase !== "lobby") {
    return NextResponse.json({ error: "Trò chơi đã bắt đầu." }, { status: 400 });
  }

  if (room.players.some((p) => p.username === player.username)) {
    const nextPlayers = room.players.map((entry) =>
      entry.username === player.username &&
      (entry.avatarId !== avatarId ||
        entry.avatarUrl !== avatarUrl ||
        entry.displayName !== player.displayName)
        ? { ...entry, displayName: player.displayName, avatarId, avatarUrl }
        : entry
    );
    if (nextPlayers.some((entry, index) => entry !== room.players[index])) {
      await roomDoc.ref.update({
        players: serializePlayers(nextPlayers),
        updatedAt: Date.now(),
      });
      const updated = mapRoom(await roomDoc.ref.get());
      return NextResponse.json({ room: updated });
    }
    return NextResponse.json({ room });
  }

  if (room.players.length >= 12) {
    return NextResponse.json({ error: "Phòng đã đầy." }, { status: 400 });
  }

  const now = Date.now();
  const nextPlayers = [
    ...room.players,
    {
      username: player.username,
      displayName: player.displayName,
      avatarId,
      avatarUrl,
      status: "alive" as const,
      role: null,
      isHost: false,
      isBot: false,
    },
  ];

  await roomDoc.ref.update({
    players: serializePlayers(nextPlayers),
    playerUsernames: [...room.players.map((p) => p.username), player.username],
    updatedAt: now,
    lastEvent: `${player.displayName} đã tham gia phòng.`,
  });

  const updated = mapRoom(await roomDoc.ref.get());
  return NextResponse.json({ room: updated });
}

export async function GET(request: NextRequest) {
  const inviteCode = request.nextUrl.searchParams.get("inviteCode")?.trim().toUpperCase();
  if (!inviteCode) {
    return NextResponse.json({ error: "Missing invite code." }, { status: 400 });
  }

  const snapshot = await db
    .collection(WEREWOLF_ROOMS_COLLECTION)
    .where("inviteCode", "==", inviteCode)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const room = mapRoom(snapshot.docs[0]);
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    room: {
      id: room.id,
      name: room.name,
      inviteCode: room.inviteCode,
      playerCount: room.players.length,
      phase: room.phase,
      hostDisplayName: room.hostDisplayName,
    },
  });
}
