import { NextRequest, NextResponse } from "next/server";
import { hashPassword, validatePassword, validateUsername } from "@/_lib/auth/password";
import { createUser, toPublicUser } from "@/_lib/auth/users";
import { setSessionCookie } from "@/_lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = validateUsername(String(body?.username ?? ""));
    const password = validatePassword(String(body?.password ?? ""));
    const displayName = String(body?.displayName ?? "").trim() || username;

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      passwordHash,
      displayName,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: toPublicUser(user),
      },
      { status: 201 }
    );

    await setSessionCookie(response, {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to register user.";

    const status =
      message === "Username is already taken." ||
      message.includes("Username must be") ||
      message.includes("Password must be")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
