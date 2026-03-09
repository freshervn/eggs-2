import { NextResponse } from "next/server";
import { readSession } from "@/_lib/auth/session";
import { getUserByUsername, toPublicUser } from "@/_lib/auth/users";

export async function GET() {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserByUsername(session.username);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: toPublicUser(user),
  });
}
