import { resolvePlayerFromBody, resolvePlayerFromRequest } from "@/_lib/scores/player";
import { resolveWerewolfAvatarFromBody } from "@/_lib/werewolf/avatar-input";
import {
  createUniqueInviteCode,
  mapRoom,
  serializePlayers,
  serializeWerewolfSettings,
} from "@/_lib/werewolf/rooms";
import { DEFAULT_WEREWOLF_SETTINGS } from "@/_lib/werewolf/settings";
import { WEREWOLF_ROOMS_COLLECTION } from "@/_lib/werewolf/game";
import { admin } from "@/_lib/firebase/Admin";
import { NextRequest, NextResponse } from "next/server";

const db = admin.firestore();

export async function GET(request: NextRequest) {
  const player = await resolvePlayerFromRequest(request);
  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await db
    .collection(WEREWOLF_ROOMS_COLLECTION)
    .where("playerUsernames", "array-contains", player.username)
    .get();

  const rooms = snapshot.docs
    .map(mapRoom)
    .filter((room): room is NonNullable<typeof room> => room !== null)
    .sort((left, right) => right.updatedAt - left.updatedAt);

  return NextResponse.json({ rooms });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const player = await resolvePlayerFromBody(body);

  if (!player) {
    return NextResponse.json(
      { error: "Nhập tên của bạn để tiếp tục." },
      { status: 401 }
    );
  }

  const name = String(body?.name ?? "").trim() || "Phòng Ma Sói";
  const { avatarId, avatarUrl } = resolveWerewolfAvatarFromBody(body, player.username);
  const inviteCode = await createUniqueInviteCode();
  const now = Date.now();

  const players = [
    {
      username: player.username,
      displayName: player.displayName,
      avatarId,
      avatarUrl,
      status: "alive" as const,
      role: null,
      isHost: true,
      isBot: false,
    },
  ];

  const docRef = await db.collection(WEREWOLF_ROOMS_COLLECTION).add({
    name,
    inviteCode,
    hostUsername: player.username,
    hostDisplayName: player.displayName,
    playerUsernames: [player.username],
    phase: "lobby",
    dayNumber: 0,
    players: serializePlayers(players),
    nightActions: {},
    votes: {},
    seerResults: {},
    winner: null,
    lastEvent: "Chờ người chơi tham gia...",
    protectedUsername: null,
    settings: serializeWerewolfSettings(DEFAULT_WEREWOLF_SETTINGS),
    phaseEndsAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const room = mapRoom(await docRef.get());
  return NextResponse.json({ room }, { status: 201 });
}
