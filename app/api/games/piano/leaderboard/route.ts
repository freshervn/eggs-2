import { NextResponse } from "next/server";
import { admin } from "@/_lib/firebase/Admin";

const COLLECTION = "game_piano_scores";

type LeaderboardEntry = {
  userId: string;
  username: string;
  displayName?: string;
  bestScore: number;
  updatedAt: number;
};

export async function GET() {
  try {
    const db = admin.firestore();
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("bestScore", "desc")
      .limit(50)
      .get();

    const entries: LeaderboardEntry[] = snapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          userId: String(data.userId ?? doc.id),
          username: String(data.username ?? ""),
          displayName:
            typeof data.displayName === "string" ? data.displayName : undefined,
          bestScore: Number(data.bestScore ?? 0),
          updatedAt: Number(data.updatedAt ?? 0),
        };
      })
      .sort((a, b) => {
        if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
        return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      })
      .slice(0, 10);

    return NextResponse.json({ entries }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "firestore_error";
    return NextResponse.json({ entries: [], error: msg }, { status: 500 });
  }
}
