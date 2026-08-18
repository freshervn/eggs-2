import { resolvePlayerFromRequest } from "@/_lib/scores/player";
import {
  createWerewolfBot,
  fillBotNightActions,
  fillBotVotes,
} from "@/_lib/werewolf/bots";
import {
  assignRoles,
  buildPlayerView,
  canPerformNightAction,
  canVote,
  checkWinner,
  getPendingNightActors,
  getPendingVoters,
  getPlayer,
  isValidNightTarget,
  isValidVoteTarget,
  MAX_PLAYERS,
  MIN_PLAYERS,
  resolveNight,
  resolveVoting,
} from "@/_lib/werewolf/game";
import {
  getRoomRef,
  mapRoom,
  serializePlayers,
  serializeWerewolfSettings,
} from "@/_lib/werewolf/rooms";
import {
  computePhaseEndsAt,
  normalizeWerewolfSettings,
} from "@/_lib/werewolf/settings";
import type { WerewolfRoomRecord } from "@/_lib/werewolf/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const player = await resolvePlayerFromRequest(request);
  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const room = mapRoom(await getRoomRef(roomId).get());
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!room.players.some((p) => p.username === player.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const view = buildPlayerView(room, player.username);
  return NextResponse.json({ room: view });
}

function applyNightResolution(
  room: WerewolfRoomRecord,
  nightActions: Record<string, string>,
  now: number
) {
  const filled = fillBotNightActions(room, nightActions);
  const nightRoom = { ...room, nightActions: filled };
  const resolved = resolveNight(nightRoom);
  const winner = checkWinner(resolved.players);
  const nextPhase = winner ? "ended" : "day";

  let payload: Record<string, unknown> = {
    players: serializePlayers(resolved.players),
    nightActions: filled,
    seerResults: resolved.seerResults,
    phase: nextPhase,
    winner,
    protectedUsername: resolved.protectedUsername,
    lastEvent: resolved.lastEvent,
    phaseEndsAt: computePhaseEndsAt(nextPhase, room.settings, now),
    updatedAt: now,
  };

  if (nextPhase === "day") {
    // Day has no bot actions until voting.
  }

  return payload;
}

function applyVoteResolution(
  room: WerewolfRoomRecord,
  votes: Record<string, string>,
  now: number
) {
  const filled = fillBotVotes(room, votes);
  const voteResult = resolveVoting(room.players, filled);
  const winner = checkWinner(voteResult.players);
  const nextPhase = winner ? "ended" : "night";
  const nextDay = winner ? room.dayNumber : room.dayNumber + 1;

  let payload: Record<string, unknown> = {
    players: serializePlayers(voteResult.players),
    phase: nextPhase,
    dayNumber: nextDay,
    nightActions: {},
    votes: winner ? filled : {},
    winner,
    lastEvent: voteResult.lastEvent,
    phaseEndsAt: computePhaseEndsAt(nextPhase, room.settings, now),
    updatedAt: now,
  };

  if (nextPhase === "night") {
    const nightRoom: WerewolfRoomRecord = {
      ...room,
      players: voteResult.players,
      phase: "night",
      dayNumber: nextDay,
      nightActions: {},
      votes: {},
      winner: null,
    };
    const nightActions = fillBotNightActions(nightRoom, {});
    const pending = getPendingNightActors(nightRoom.players, nightActions);
    if (pending.length === 0) {
      payload = applyNightResolution(nightRoom, nightActions, now);
      payload.lastEvent = `${voteResult.lastEvent} ${String(payload.lastEvent ?? "")}`.trim();
    } else {
      payload.nightActions = nightActions;
    }
  }

  return payload;
}

function enterVoting(room: WerewolfRoomRecord, now: number, lastEvent: string) {
  const votingRoom: WerewolfRoomRecord = {
    ...room,
    phase: "voting",
    votes: {},
  };
  const votes = fillBotVotes(votingRoom, {});
  const pending = getPendingVoters(votingRoom.players, votes);

  if (pending.length === 0) {
    const resolved = applyVoteResolution(votingRoom, votes, now);
    return {
      ...resolved,
      lastEvent: `${lastEvent} ${String(resolved.lastEvent ?? "")}`.trim(),
    };
  }

  return {
    phase: "voting",
    votes,
    phaseEndsAt: computePhaseEndsAt("voting", room.settings, now),
    lastEvent,
    updatedAt: now,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const player = await resolvePlayerFromRequest(request, body);
  if (!player) {
    return NextResponse.json(
      { error: "Nhập tên của bạn để tiếp tục." },
      { status: 401 }
    );
  }

  const { roomId } = await context.params;
  const roomRef = getRoomRef(roomId);
  const room = mapRoom(await roomRef.get());

  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const me = getPlayer(room.players, player.username);
  if (!me) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const action = String(body?.action ?? "").trim();
  const targetUsername = String(body?.targetUsername ?? "").trim();
  const now = Date.now();

  if (action === "update_settings") {
    if (!me.isHost || room.phase !== "lobby") {
      return NextResponse.json(
        { error: "Chỉ chủ phòng mới chỉnh cài đặt khi chờ." },
        { status: 400 }
      );
    }

    const settings = normalizeWerewolfSettings({
      ...room.settings,
      ...(body?.settings && typeof body.settings === "object" ? body.settings : {}),
    });

    await roomRef.update({
      settings: serializeWerewolfSettings(settings),
      lastEvent: "Chủ phòng đã cập nhật cài đặt trò chơi.",
      updatedAt: now,
    });
  } else if (action === "add_bot") {
    if (!me.isHost || room.phase !== "lobby") {
      return NextResponse.json({ error: "Không thể thêm bot." }, { status: 400 });
    }
    if (room.players.length >= MAX_PLAYERS) {
      return NextResponse.json({ error: "Phòng đã đầy." }, { status: 400 });
    }

    const bot = createWerewolfBot(room.players);
    if (!bot) {
      return NextResponse.json({ error: "Không tạo được bot." }, { status: 400 });
    }

    const nextPlayers = [...room.players, bot];
    await roomRef.update({
      players: serializePlayers(nextPlayers),
      playerUsernames: nextPlayers.map((entry) => entry.username),
      lastEvent: `${bot.displayName} (bot) đã vào phòng.`,
      updatedAt: now,
    });
  } else if (action === "remove_bot") {
    if (!me.isHost || room.phase !== "lobby") {
      return NextResponse.json({ error: "Không thể xóa bot." }, { status: 400 });
    }

    const bot = getPlayer(room.players, targetUsername);
    if (!bot || !bot.isBot) {
      return NextResponse.json({ error: "Bot không hợp lệ." }, { status: 400 });
    }

    const nextPlayers = room.players.filter(
      (entry) => entry.username !== targetUsername
    );
    await roomRef.update({
      players: serializePlayers(nextPlayers),
      playerUsernames: nextPlayers.map((entry) => entry.username),
      lastEvent: `${bot.displayName} (bot) đã bị xóa.`,
      updatedAt: now,
    });
  } else if (action === "start") {
    if (!me.isHost || room.phase !== "lobby") {
      return NextResponse.json({ error: "Không thể bắt đầu." }, { status: 400 });
    }
    if (room.players.length < MIN_PLAYERS) {
      return NextResponse.json(
        { error: `Cần ít nhất ${MIN_PLAYERS} người chơi.` },
        { status: 400 }
      );
    }

    const players = assignRoles(room.players, room.settings);
    const startedRoom: WerewolfRoomRecord = {
      ...room,
      players,
      phase: "night",
      dayNumber: 1,
      nightActions: {},
      votes: {},
      seerResults: {},
      winner: null,
      protectedUsername: null,
    };
    const nightActions = fillBotNightActions(startedRoom, {});
    const pending = getPendingNightActors(players, nightActions);

    if (pending.length === 0) {
      const resolved = applyNightResolution(startedRoom, nightActions, now);
      await roomRef.update({
        ...resolved,
        dayNumber: 1,
        lastEvent: `Trò chơi bắt đầu! ${String(resolved.lastEvent ?? "")}`.trim(),
      });
    } else {
      await roomRef.update({
        players: serializePlayers(players),
        phase: "night",
        dayNumber: 1,
        nightActions,
        votes: {},
        seerResults: {},
        winner: null,
        protectedUsername: null,
        phaseEndsAt: computePhaseEndsAt("night", room.settings, now),
        lastEvent: "Trò chơi bắt đầu! Ban đêm đã đến...",
        updatedAt: now,
      });
    }
  } else if (action === "night_action") {
    if (!canPerformNightAction(room, player.username)) {
      return NextResponse.json({ error: "Không thể thực hiện hành động." }, { status: 400 });
    }
    if (!isValidNightTarget(room, player.username, targetUsername)) {
      return NextResponse.json({ error: "Mục tiêu không hợp lệ." }, { status: 400 });
    }

    const nightActions = fillBotNightActions(room, {
      ...room.nightActions,
      [player.username]: targetUsername,
    });
    const pending = getPendingNightActors(room.players, nightActions);

    if (pending.length === 0) {
      await roomRef.update(applyNightResolution(room, nightActions, now));
    } else {
      await roomRef.update({
        nightActions,
        lastEvent: `${me.displayName} đã chọn mục tiêu ban đêm.`,
        updatedAt: now,
      });
    }
  } else if (action === "start_vote") {
    if (!me.isHost || room.phase !== "day") {
      return NextResponse.json({ error: "Không thể bắt đầu bỏ phiếu." }, { status: 400 });
    }

    await roomRef.update(
      enterVoting(room, now, "Dân làng bắt đầu bỏ phiếu loại nghi phạm.")
    );
  } else if (action === "vote") {
    if (!canVote(room, player.username)) {
      return NextResponse.json({ error: "Không thể bỏ phiếu." }, { status: 400 });
    }
    if (!isValidVoteTarget(room, player.username, targetUsername)) {
      return NextResponse.json({ error: "Mục tiêu không hợp lệ." }, { status: 400 });
    }

    const votes = fillBotVotes(room, {
      ...room.votes,
      [player.username]: targetUsername,
    });
    const pending = getPendingVoters(room.players, votes);

    if (pending.length === 0) {
      await roomRef.update(applyVoteResolution(room, votes, now));
    } else {
      await roomRef.update({
        votes,
        lastEvent: `${me.displayName} đã bỏ phiếu.`,
        updatedAt: now,
      });
    }
  } else if (action === "timeout") {
    if (!room.phaseEndsAt || now < room.phaseEndsAt) {
      return NextResponse.json({ error: "Chưa hết giờ." }, { status: 400 });
    }

    if (room.phase === "night") {
      await roomRef.update(applyNightResolution(room, room.nightActions, now));
    } else if (room.phase === "day") {
      await roomRef.update(
        enterVoting(room, now, "Hết giờ thảo luận — bắt đầu bỏ phiếu.")
      );
    } else if (room.phase === "voting") {
      await roomRef.update(applyVoteResolution(room, room.votes, now));
    } else {
      return NextResponse.json({ error: "Không có pha để hết giờ." }, { status: 400 });
    }
  } else if (action === "reset") {
    if (!me.isHost) {
      return NextResponse.json({ error: "Chỉ chủ phòng mới reset được." }, { status: 400 });
    }

    const players = room.players.map((p) => ({
      ...p,
      status: "alive" as const,
      role: null,
    }));

    await roomRef.update({
      players: serializePlayers(players),
      phase: "lobby",
      dayNumber: 0,
      nightActions: {},
      votes: {},
      seerResults: {},
      winner: null,
      protectedUsername: null,
      phaseEndsAt: null,
      lastEvent: "Phòng đã được reset. Chờ người chơi mới.",
      updatedAt: now,
    });
  } else {
    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  }

  const updated = mapRoom(await roomRef.get());
  const view = updated ? buildPlayerView(updated, player.username) : null;
  return NextResponse.json({ room: view });
}
