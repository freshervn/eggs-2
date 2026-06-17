import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/_lib/auth/session";
import { realtimeAdminDB } from "@/_lib/firebase/Admin";

export type MoneyInEntry = {
  amount: number;
  from: string;
  note: string;
  createdAt: number;
};

function signedAmount(amount: number, direction?: string): number | null {
  if (typeof amount !== "number" || amount === 0) return null;
  const abs = Math.abs(amount);
  if (direction === "out") return -abs;
  if (direction === "in") return abs;
  return amount;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body ||
      typeof body.amount !== "number" ||
      typeof body.from !== "string" ||
      !body.from.trim()
    ) {
      return NextResponse.json(
        { error: "amount and from are required" },
        { status: 400 }
      );
    }

    const amount = signedAmount(
      body.amount,
      typeof body.direction === "string" ? body.direction : undefined
    );
    if (amount == null) {
      return NextResponse.json(
        { error: "amount must be a non-zero number" },
        { status: 400 }
      );
    }

    const entry: MoneyInEntry = {
      amount,
      from: body.from.trim(),
      note: typeof body.note === "string" ? body.note.trim() : "",
      createdAt: Date.now(),
    };

    const ref = realtimeAdminDB.ref("money-in").push();
    await ref.set(entry);

    return NextResponse.json(
      { success: true, id: ref.key, entry },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to save entry",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      await realtimeAdminDB.ref(`money-in/${id}`).remove();
      return NextResponse.json({ success: true, id });
    }

    await realtimeAdminDB.ref("money-in").remove();

    return NextResponse.json({ success: true, message: "Manual entries cleared" });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to clear manual entries",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
