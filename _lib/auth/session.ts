import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "eggs_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  userId: string;
  username: string;
  displayName: string;
}

const getSessionSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Missing AUTH_SECRET. Add AUTH_SECRET to your environment variables."
    );
  }

  return new TextEncoder().encode(secret);
};

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
});

export const createSessionToken = async (user: SessionUser) => {
  return new SignJWT({
    username: user.username,
    displayName: user.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
};

export const readSession = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.displayName !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      username: payload.username,
      displayName: payload.displayName,
    };
  } catch {
    return null;
  }
};

export const setSessionCookie = async (
  response: NextResponse,
  user: SessionUser
) => {
  const token = await createSessionToken(user);
  response.cookies.set(SESSION_COOKIE_NAME, token, getCookieOptions());
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
};
