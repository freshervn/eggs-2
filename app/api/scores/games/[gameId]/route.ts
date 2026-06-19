import { readSession } from "@/_lib/auth/session";
import { getGameRef, mapGame, ScorePlayer } from "@/_lib/scores/games";
import { NextRequest, NextResponse } from "next/server";

const parsePlayers = (value: unknown): ScorePlayer[] | null => {
  if (!Array.isArray(value)) return null;
  return value.map((p, index) => {
    const item = (p ?? {}) as Record<string, unknown>;
    const score = Number(item.score ?? 0);
    return {
      id: String(item.id ?? `player-${index}`),
      name: String(item.name ?? "").trim(),
      score: Number.isFinite(score) ? score : 0,
      username: item.username ? String(item.username) : undefined,
    };
  });
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await context.params;
  const ref = getGameRef(gameId);
  const snap = await ref.get();
  const game = mapGame(snap);

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (game.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  if (body?.name !== undefined) {
    updates.name = String(body.name).trim() || game.name;
  }

  if (body?.players !== undefined) {
    const players = parsePlayers(body.players);
    if (!players) {
      return NextResponse.json({ error: "Invalid players" }, { status: 400 });
    }
    updates.players = players;
  }

  await ref.update(updates);
  const updated = mapGame(await ref.get());
  return NextResponse.json({ game: updated });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await context.params;
  const ref = getGameRef(gameId);
  const snap = await ref.get();
  const game = mapGame(snap);

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (game.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
