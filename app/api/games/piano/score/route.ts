import { NextResponse } from "next/server";
import { readSession } from "@/_lib/auth/session";
import { getUserByUsername } from "@/_lib/auth/users";
import { admin } from "@/_lib/firebase/Admin";

const COLLECTION = "game_piano_scores";

type ScoreDoc = {
  userId: string;
  username: string;
  displayName?: string;
  bestScore: number;
  lastScore: number;
  updatedAt: number;
  createdAt: number;
};

const asFiniteNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await getUserByUsername(session.username);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = admin.firestore();
  const ref = db.collection(COLLECTION).doc(session.userId);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ bestScore: 0, lastScore: 0 }, { status: 200 });
  }

  const data = snap.data() ?? {};
  return NextResponse.json(
    {
      bestScore: Number(data.bestScore ?? 0),
      lastScore: Number(data.lastScore ?? 0),
      updatedAt: Number(data.updatedAt ?? 0),
    },
    { status: 200 },
  );
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await getUserByUsername(session.username);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const lastScore = asFiniteNumber(payload.lastScore);
  const bestScore = asFiniteNumber(payload.bestScore);

  if (lastScore == null || bestScore == null) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const safeLast = Math.max(0, Math.floor(lastScore));
  const safeBest = Math.max(0, Math.floor(bestScore));

  const db = admin.firestore();
  const ref = db.collection(COLLECTION).doc(session.userId);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? (snap.data() as Partial<ScoreDoc>) : null;
    const prevBest = Number(prev?.bestScore ?? 0);
    const nextBest = Math.max(prevBest, safeBest, safeLast);

    const nextDoc: Partial<ScoreDoc> = {
      userId: session.userId,
      username: session.username,
      displayName: user.displayName,
      lastScore: safeLast,
      bestScore: nextBest,
      updatedAt: now,
      createdAt: Number(prev?.createdAt ?? now),
    };

    tx.set(ref, nextDoc, { merge: true });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

