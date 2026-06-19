import { getUserByUsername } from "@/_lib/auth/users";
import {
  getRoomHistoryCollection,
  getRoomRef,
  defaultRowColorForIndex,
  mapRoom,
  serializeRoomMembers,
} from "@/_lib/scores/games";
import { resolvePlayerFromBody, resolvePlayerFromRequest } from "@/_lib/scores/player";
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

  const snap = await getRoomRef(roomId).get();
  const room = mapRoom(snap);

  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!room.memberUsernames.includes(player.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ room });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const body = await request.json();
  const player = await resolvePlayerFromBody(body);

  if (!player) {
    return NextResponse.json(
      { error: "Nhập tên của bạn để tiếp tục." },
      { status: 401 }
    );
  }

  const { roomId } = await context.params;
  const ref = getRoomRef(roomId);
  const snap = await ref.get();
  const room = mapRoom(snap);

  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!room.memberUsernames.includes(player.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();
  let members = [...room.members];
  let memberUsernames = [...room.memberUsernames];
  const updates: Record<string, unknown> = { updatedAt: now };

  if (body?.name !== undefined && room.hostUsername === player.username) {
    updates.name = String(body.name).trim() || room.name;
  }

  if (body?.score !== undefined) {
    const score = Number(body.score);
    if (!Number.isFinite(score)) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const targetUsername = String(body?.targetUsername ?? player.username).trim();
    if (!room.memberUsernames.includes(targetUsername)) {
      return NextResponse.json({ error: "Member not found" }, { status: 400 });
    }

    const editingOther = targetUsername !== player.username;
    if (editingOther && room.hostUsername !== player.username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetMember = room.members.find((m) => m.username === targetUsername);
    const previousScore = targetMember?.score ?? 0;
    const previousRound = targetMember?.roundScore ?? 0;
    const delta = score - previousScore;

    members = members.map((m) =>
      m.username === targetUsername
        ? {
            ...m,
            score,
            roundScore: previousRound + delta,
            displayName:
              targetUsername === player.username ? player.displayName : m.displayName,
          }
        : m
    );
    updates.members = members;

    if (previousScore !== score) {
      await getRoomHistoryCollection(roomId).add({
        memberUsername: targetUsername,
        memberDisplayName: targetMember?.displayName ?? targetUsername,
        previousScore,
        newScore: score,
        delta,
        changedByUsername: player.username,
        changedByDisplayName: player.displayName,
        createdAt: now,
      });
    }
  }

  if (body?.rowColor !== undefined) {
    const rowColor = String(body.rowColor).trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(rowColor)) {
      return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }

    const targetUsername = String(body?.targetUsername ?? player.username).trim();
    if (!room.memberUsernames.includes(targetUsername)) {
      return NextResponse.json({ error: "Member not found" }, { status: 400 });
    }

    const editingOther = targetUsername !== player.username;
    if (editingOther && room.hostUsername !== player.username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    members = members.map((m) =>
      m.username === targetUsername ? { ...m, rowColor } : m
    );
    updates.members = members;
  }

  if (body?.resetAll === true && room.hostUsername === player.username) {
    updates.roundNumber = 1;
    updates.members = members.map((m) => ({ ...m, score: 0, roundScore: 0 }));
  }

  if (body?.newRound === true && room.hostUsername === player.username) {
    updates.roundNumber = (room.roundNumber ?? 1) + 1;
    updates.members = members.map((m) => ({ ...m, roundScore: 0 }));
  }

  if (
    !player.isGuest &&
    body?.inviteUsername !== undefined &&
    room.hostUsername === player.username
  ) {
    const inviteUsername = String(body.inviteUsername).trim().toLowerCase();
    if (inviteUsername && !memberUsernames.includes(inviteUsername)) {
      const invited = await getUserByUsername(inviteUsername);
      if (invited) {
        memberUsernames = [...memberUsernames, invited.username];
        members = [
          ...members,
          {
            username: invited.username,
            displayName: invited.displayName,
            score: 0,
            roundScore: 0,
            rowColor: defaultRowColorForIndex(members.length),
          },
        ];
        updates.memberUsernames = memberUsernames;
        updates.members = members;
      }
    }
  }

  if (updates.members) {
    updates.members = serializeRoomMembers(updates.members as typeof room.members);
  }

  await ref.update(updates);
  const updated = mapRoom(await ref.get());
  return NextResponse.json({ room: updated });
}
