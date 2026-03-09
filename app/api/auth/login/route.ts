import { NextRequest, NextResponse } from "next/server";
import { validatePassword, validateUsername, verifyPassword } from "@/_lib/auth/password";
import { getUserByUsername, toPublicUser } from "@/_lib/auth/users";
import { setSessionCookie } from "@/_lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = validateUsername(String(body?.username ?? ""));
    const password = validatePassword(String(body?.password ?? ""));
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: toPublicUser(user),
    });

    await setSessionCookie(response, {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign in.";
    const status =
      message.includes("Username must be") || message.includes("Password must be")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
