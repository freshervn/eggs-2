import { NextResponse } from "next/server";
import { readSession } from "@/_lib/auth/session";
import { getUserByUsername } from "@/_lib/auth/users";
import { admin } from "@/_lib/firebase/Admin";

const COLLECTION = "game_sam_stats";

type StatsDoc = {
  userId: string;
  username: string;
  displayName?: string;
  wins: number;
  losses: number;
  updatedAt: number;
  createdAt: number;
};

const asResult = (v: unknown): "win" | "loss" | null => {
  if (v === "win" || v === "loss") return v;
  return null;
};

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await getUserByUsername(session.username);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = admin.firestore();
  const ref = db.collection(COLLECTION).doc(session.userId);
  const snap = await ref.get();
  const data = snap.exists ? (snap.data() as Partial<StatsDoc>) : null;

  return NextResponse.json(
    {
      stats: {
        wins: Number(data?.wins ?? 0),
        losses: Number(data?.losses ?? 0),
        updatedAt: Number(data?.updatedAt ?? 0) || undefined,
      },
    },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await getUserByUsername(session.username);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const result = asResult(payload.result);
  if (!result) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const db = admin.firestore();
  const ref = db.collection(COLLECTION).doc(session.userId);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? (snap.data() as Partial<StatsDoc>) : {};
    const wins = Number(prev.wins ?? 0);
    const losses = Number(prev.losses ?? 0);

    const next: StatsDoc = {
      userId: session.userId,
      username: session.username,
      displayName: user.displayName,
      wins: result === "win" ? wins + 1 : wins,
      losses: result === "loss" ? losses + 1 : losses,
      updatedAt: now,
      createdAt: Number(prev.createdAt ?? now),
    };

    tx.set(ref, next, { merge: true });
  });

  const finalSnap = await ref.get();
  const final = (finalSnap.data() ?? {}) as Partial<StatsDoc>;

  return NextResponse.json(
    {
      stats: {
        wins: Number(final.wins ?? 0),
        losses: Number(final.losses ?? 0),
        updatedAt: Number(final.updatedAt ?? now),
      },
    },
    { status: 200 }
  );
}

