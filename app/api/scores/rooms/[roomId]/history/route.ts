import {
  getRoomHistoryCollection,
  getRoomRef,
  mapHistoryEntry,
  mapRoom,
  SCORE_HISTORY_LIMIT,
} from "@/_lib/scores/games";
import { resolvePlayerFromRequest } from "@/_lib/scores/player";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;
  const player = await resolvePlayerFromRequest(request);

  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = mapRoom(await getRoomRef(roomId).get());
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!room.memberUsernames.includes(player.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const memberUsername =
    request.nextUrl.searchParams.get("memberUsername")?.trim() ?? "";

  if (!memberUsername || !room.memberUsernames.includes(memberUsername)) {
    return NextResponse.json({ error: "Member not found" }, { status: 400 });
  }

  const snapshot = await getRoomHistoryCollection(roomId)
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const history = snapshot.docs
    .map(mapHistoryEntry)
    .filter((entry) => entry.memberUsername === memberUsername)
    .slice(0, SCORE_HISTORY_LIMIT);

  return NextResponse.json({ history });
}
