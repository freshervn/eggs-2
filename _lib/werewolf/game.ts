import {
  PlayerStatus,
  WerewolfPhase,
  WerewolfPlayer,
  WerewolfRole,
  WerewolfRoomRecord,
  WerewolfRoomSettings,
  WerewolfRoomView,
  WerewolfWinner,
} from "./types";
import { DEFAULT_WEREWOLF_SETTINGS } from "./settings";

export const WEREWOLF_ROOMS_COLLECTION = "werewolfRooms";
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateInviteCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
};

export const roleLabel = (role: WerewolfRole) => {
  switch (role) {
    case "werewolf":
      return "Ma Sói";
    case "villager":
      return "Dân Làng";
    case "seer":
      return "Tiên Tri";
    case "doctor":
      return "Bác Sĩ";
  }
};

export const phaseLabel = (phase: WerewolfPhase) => {
  switch (phase) {
    case "lobby":
      return "Phòng chờ";
    case "night":
      return "Ban đêm";
    case "day":
      return "Ban ngày";
    case "voting":
      return "Bỏ phiếu";
    case "ended":
      return "Kết thúc";
  }
};

const shuffle = <T>(items: T[]) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const assignRoles = (
  players: WerewolfPlayer[],
  settings?: WerewolfRoomSettings
): WerewolfPlayer[] => {
  const count = players.length;
  const autoWolves = Math.max(1, Math.floor(count / 4));
  const wolfCount = settings?.wolfCount
    ? Math.min(settings.wolfCount, Math.max(1, count - 1))
    : autoWolves;
  const hasSeer = settings ? settings.enableSeer && count >= 5 : count >= 5;
  const hasDoctor = settings ? settings.enableDoctor && count >= 6 : count >= 6;

  const roles: WerewolfRole[] = [];
  for (let i = 0; i < wolfCount; i++) roles.push("werewolf");
  if (hasSeer) roles.push("seer");
  if (hasDoctor) roles.push("doctor");
  while (roles.length < count) roles.push("villager");

  const shuffledRoles = shuffle(roles);
  return players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index] ?? "villager",
    status: "alive" as PlayerStatus,
  }));
};

export const getAlivePlayers = (players: WerewolfPlayer[]) =>
  players.filter((player) => player.status === "alive");

export const getWerewolves = (players: WerewolfPlayer[]) =>
  getAlivePlayers(players).filter((player) => player.role === "werewolf");

export const getPlayer = (players: WerewolfPlayer[], username: string) =>
  players.find((player) => player.username === username) ?? null;

export const getRequiredNightActors = (players: WerewolfPlayer[]) => {
  const alive = getAlivePlayers(players);
  const actors: string[] = [];

  for (const player of alive) {
    if (player.role === "werewolf" || player.role === "seer" || player.role === "doctor") {
      actors.push(player.username);
    }
  }

  return actors;
};

export const getPendingNightActors = (
  players: WerewolfPlayer[],
  nightActions: Record<string, string>
) => getRequiredNightActors(players).filter((username) => !nightActions[username]);

export const getPendingVoters = (
  players: WerewolfPlayer[],
  votes: Record<string, string>
) =>
  getAlivePlayers(players)
    .map((player) => player.username)
    .filter((username) => !votes[username]);

const pickMajorityTarget = (actions: Record<string, string>) => {
  const counts = new Map<string, number>();
  for (const target of Object.values(actions)) {
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }

  let bestTarget = "";
  let bestCount = 0;
  let tied = false;

  for (const [target, count] of counts) {
    if (count > bestCount) {
      bestTarget = target;
      bestCount = count;
      tied = false;
    } else if (count === bestCount && count > 0) {
      tied = true;
    }
  }

  if (!bestTarget || tied) {
    const candidates = [...counts.entries()]
      .filter(([, count]) => count === bestCount)
      .map(([target]) => target);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? "";
  }

  return bestTarget;
};

export const resolveNight = (
  room: WerewolfRoomRecord
): {
  players: WerewolfPlayer[];
  lastEvent: string;
  protectedUsername: string | null;
  seerResults: Record<string, WerewolfRole>;
} => {
  const wolfVotes: Record<string, string> = {};
  let protectedUsername: string | null = null;
  const seerResults = { ...room.seerResults };

  for (const [actor, target] of Object.entries(room.nightActions)) {
    const actorPlayer = getPlayer(room.players, actor);
    if (!actorPlayer || actorPlayer.status !== "alive") continue;

    if (actorPlayer.role === "werewolf") {
      wolfVotes[actor] = target;
    } else if (actorPlayer.role === "doctor") {
      protectedUsername = target;
    } else if (actorPlayer.role === "seer") {
      const targetPlayer = getPlayer(room.players, target);
      if (targetPlayer?.role) {
        seerResults[target] = targetPlayer.role;
      }
    }
  }

  const killTarget = pickMajorityTarget(wolfVotes);
  let lastEvent = "Đêm yên bình — không ai bị tấn công.";

  const players = room.players.map((player) => ({ ...player }));

  if (killTarget && killTarget !== protectedUsername) {
    const victim = getPlayer(players, killTarget);
    if (victim && victim.status === "alive") {
      victim.status = "dead";
      lastEvent = `${victim.displayName} đã bị ma sói tấn công và chết trong đêm.`;
    }
  } else if (killTarget && killTarget === protectedUsername) {
    const saved = getPlayer(players, killTarget);
    lastEvent = saved
      ? `Ma sói tấn công ${saved.displayName} nhưng bác sĩ đã cứu được.`
      : "Ma sói tấn công nhưng nạn nhân được bác sĩ cứu.";
  }

  return { players, lastEvent, protectedUsername, seerResults };
};

export const resolveVoting = (
  players: WerewolfPlayer[],
  votes: Record<string, string>
): { players: WerewolfPlayer[]; lastEvent: string } => {
  const aliveVotes = Object.fromEntries(
    Object.entries(votes).filter(([voter]) => {
      const player = getPlayer(players, voter);
      return player?.status === "alive";
    })
  );

  const eliminated = pickMajorityTarget(aliveVotes);
  const nextPlayers = players.map((player) => ({ ...player }));

  if (!eliminated) {
    return { players: nextPlayers, lastEvent: "Không đủ phiếu — không ai bị loại." };
  }

  const voteCounts = new Map<string, number>();
  for (const target of Object.values(aliveVotes)) {
    voteCounts.set(target, (voteCounts.get(target) ?? 0) + 1);
  }
  const topCount = Math.max(...voteCounts.values(), 0);
  const topTargets = [...voteCounts.entries()]
    .filter(([, count]) => count === topCount)
    .map(([target]) => target);

  if (topTargets.length !== 1) {
    return { players: nextPlayers, lastEvent: "Hòa phiếu — không ai bị loại." };
  }

  const victim = getPlayer(nextPlayers, eliminated);
  if (!victim || victim.status !== "alive") {
    return { players: nextPlayers, lastEvent: "Không ai bị loại." };
  }

  victim.status = "dead";
  return {
    players: nextPlayers,
    lastEvent: `${victim.displayName} bị dân làng bỏ phiếu loại (${topCount} phiếu).`,
  };
};

export const checkWinner = (players: WerewolfPlayer[]): WerewolfWinner | null => {
  const alive = getAlivePlayers(players);
  const wolves = alive.filter((player) => player.role === "werewolf");
  const villagers = alive.filter((player) => player.role !== "werewolf");

  if (wolves.length === 0) return "villagers";
  if (wolves.length >= villagers.length) return "werewolves";
  return null;
};

export const buildPlayerView = (
  room: WerewolfRoomRecord,
  username: string
): WerewolfRoomView | null => {
  const me = getPlayer(room.players, username);
  if (!me) return null;

  const isDead = me.status === "dead";
  const knownRoles: Record<string, WerewolfRole> = {};

  if (me.role) {
    knownRoles[username] = me.role;
  }

  if (me.role === "werewolf" || isDead) {
    for (const player of room.players) {
      if (player.role === "werewolf") {
        knownRoles[player.username] = "werewolf";
      }
    }
  }

  if (isDead) {
    for (const player of room.players) {
      if (player.role) {
        knownRoles[player.username] = player.role;
      }
    }
  }

  if (
    room.phase === "ended" &&
    (room.settings ?? DEFAULT_WEREWOLF_SETTINGS).revealRolesAtEnd
  ) {
    for (const player of room.players) {
      if (player.role) {
        knownRoles[player.username] = player.role;
      }
    }
  }

  const seerResults =
    me.role === "seer" ||
    isDead ||
    (room.phase === "ended" &&
      (room.settings ?? DEFAULT_WEREWOLF_SETTINGS).revealRolesAtEnd)
      ? room.seerResults
      : {};

  const pendingNightActors = getPendingNightActors(room.players, room.nightActions);
  const pendingVoters = getPendingVoters(room.players, room.votes);

  return {
    id: room.id,
    name: room.name,
    inviteCode: room.inviteCode,
    hostUsername: room.hostUsername,
    hostDisplayName: room.hostDisplayName,
    phase: room.phase,
    dayNumber: room.dayNumber,
    players: room.players.map((player) => ({
      username: player.username,
      displayName: player.displayName,
      avatarId: player.avatarId,
      avatarUrl: player.avatarUrl,
      status: player.status,
      isHost: player.isHost,
      isBot: Boolean(player.isBot),
    })),
    myRole: me.role,
    knownRoles,
    seerResults,
    nightActions: filterOwnActions(room, username),
    votes: room.phase === "voting" || room.phase === "ended" ? room.votes : {},
    winner: room.winner,
    lastEvent: room.lastEvent,
    protectedUsername:
      room.phase === "day" || room.phase === "ended" ? room.protectedUsername : null,
    settings: room.settings ?? DEFAULT_WEREWOLF_SETTINGS,
    phaseEndsAt: room.phaseEndsAt ?? null,
    pendingNightActors,
    pendingVoters,
    canStart:
      room.phase === "lobby" &&
      me.isHost &&
      room.players.length >= MIN_PLAYERS &&
      room.players.length <= MAX_PLAYERS,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
};

const filterOwnActions = (room: WerewolfRoomRecord, username: string) => {
  const me = getPlayer(room.players, username);
  if (!me) return {};

  if (room.phase !== "night") return {};

  if (me.role === "werewolf") {
    const wolfUsernames = new Set(
      room.players
        .filter((player) => player.role === "werewolf" && player.status === "alive")
        .map((player) => player.username)
    );
    return Object.fromEntries(
      Object.entries(room.nightActions).filter(([actor]) => wolfUsernames.has(actor))
    );
  }

  if (me.role === "seer" || me.role === "doctor") {
    return room.nightActions[username] ? { [username]: room.nightActions[username] } : {};
  }

  return {};
};

export const canPerformNightAction = (
  room: WerewolfRoomRecord,
  username: string
) => {
  if (room.phase !== "night") return false;
  const player = getPlayer(room.players, username);
  if (!player || player.status !== "alive") return false;
  return player.role === "werewolf" || player.role === "seer" || player.role === "doctor";
};

export const canVote = (room: WerewolfRoomRecord, username: string) => {
  if (room.phase !== "voting") return false;
  const player = getPlayer(room.players, username);
  return Boolean(player && player.status === "alive" && !room.votes[username]);
};

export const isValidNightTarget = (
  room: WerewolfRoomRecord,
  actorUsername: string,
  targetUsername: string
) => {
  const actor = getPlayer(room.players, actorUsername);
  const target = getPlayer(room.players, targetUsername);
  if (!actor || !target || target.status !== "alive") return false;

  if (actor.role === "werewolf") {
    return target.role !== "werewolf";
  }

  return true;
};

export const isValidVoteTarget = (
  room: WerewolfRoomRecord,
  voterUsername: string,
  targetUsername: string
) => {
  const voter = getPlayer(room.players, voterUsername);
  const target = getPlayer(room.players, targetUsername);
  if (!voter || voter.status !== "alive") return false;
  if (!target || target.status !== "alive") return false;
  return voterUsername !== targetUsername;
};
