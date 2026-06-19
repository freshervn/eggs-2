import { readSession } from "@/_lib/auth/session";
import {
  mapGame,
  SCORE_GAMES_COLLECTION,
  ScorePlayer,
} from "@/_lib/scores/games";
import { admin } from "@/_lib/firebase/Admin";
import { NextRequest, NextResponse } from "next/server";

const db = admin.firestore();

const parsePlayers = (value: unknown): ScorePlayer[] | null => {
  if (!Array.isArray(value)) return null;
  return value.map((p, index) => {
    const item = (p ?? {}) as Record<string, unknown>;
    const score = Number(item.score ?? 0);
    return {
      id: String(item.id ?? `player-${index}-${Date.now()}`),
      name: String(item.name ?? "").trim(),
      score: Number.isFinite(score) ? score : 0,
      username: item.username ? String(item.username) : undefined,
    };
  });
};

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await db
    .collection(SCORE_GAMES_COLLECTION)
    .where("userId", "==", session.userId)
    .get();

  const games = snapshot.docs
    .map(mapGame)
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return NextResponse.json({ games });
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body?.name ?? "").trim() || "Trò chơi mới";
  const players = parsePlayers(body?.players) ?? [];

  const now = Date.now();
  const docRef = await db.collection(SCORE_GAMES_COLLECTION).add({
    userId: session.userId,
    username: session.username,
    name,
    players,
    createdAt: now,
    updatedAt: now,
  });

  const snap = await docRef.get();
  const game = mapGame(snap);

  return NextResponse.json({ game }, { status: 201 });
}
