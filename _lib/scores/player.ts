import { readSession } from "@/_lib/auth/session";
import { NextRequest } from "next/server";

export interface ScorePlayerIdentity {
  username: string;
  displayName: string;
  isGuest: boolean;
}

const GUEST_ID_PATTERN = /^guest_[a-zA-Z0-9_-]{8,64}$/;

export const isValidGuestId = (guestId: string) => GUEST_ID_PATTERN.test(guestId);

export const normalizeDisplayName = (value: unknown) => {
  const name = String(value ?? "").trim();
  if (name.length < 1 || name.length > 30) return null;
  return name;
};

export const resolvePlayerFromBody = async (
  body: Record<string, unknown> | null | undefined
): Promise<ScorePlayerIdentity | null> => {
  const session = await readSession();
  if (session) {
    return {
      username: session.username,
      displayName: session.displayName,
      isGuest: false,
    };
  }

  const guestId = String(body?.guestId ?? "").trim();
  const displayName = normalizeDisplayName(body?.displayName);

  if (!isValidGuestId(guestId) || !displayName) {
    return null;
  }

  return { username: guestId, displayName, isGuest: true };
};

export const resolvePlayerFromRequest = async (
  request: NextRequest,
  body?: Record<string, unknown> | null
): Promise<ScorePlayerIdentity | null> => {
  const session = await readSession();
  if (session) {
    return {
      username: session.username,
      displayName: session.displayName,
      isGuest: false,
    };
  }

  const guestId =
    request.nextUrl.searchParams.get("guestId")?.trim() ||
    String(body?.guestId ?? "").trim();
  const displayName = normalizeDisplayName(
    body?.displayName ?? request.nextUrl.searchParams.get("displayName")
  );

  if (!isValidGuestId(guestId)) {
    return null;
  }

  if (!displayName) {
    return { username: guestId, displayName: guestId, isGuest: true };
  }

  return { username: guestId, displayName, isGuest: true };
};
