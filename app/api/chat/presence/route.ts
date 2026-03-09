import { readSession } from "@/_lib/auth/session";
import { getPresenceRef } from "@/_lib/chat/rooms";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  await getPresenceRef(session.username).set(
    {
      username: session.username,
      displayName: session.displayName,
      isOnline: true,
      updatedAt: now,
      lastSeenAt: now,
    },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  await getPresenceRef(session.username).set(
    {
      username: session.username,
      displayName: session.displayName,
      isOnline: false,
      updatedAt: now,
      lastSeenAt: now,
    },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}
