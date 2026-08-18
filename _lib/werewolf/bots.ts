import { getDefaultWerewolfAvatarForUsername } from "./avatars";
import {
  getAlivePlayers,
  getPendingNightActors,
  getPendingVoters,
  getPlayer,
  isValidNightTarget,
  isValidVoteTarget,
  MAX_PLAYERS,
} from "./game";
import type { WerewolfPlayer, WerewolfRoomRecord } from "./types";

const BOT_NAMES = [
  "Bot Lan",
  "Bot Hùng",
  "Bot Mai",
  "Bot Tuấn",
  "Bot Vy",
  "Bot An",
  "Bot Khoa",
  "Bot Ngân",
  "Bot Phong",
  "Bot Hà",
  "Bot Long",
  "Bot My",
];

export const isWerewolfBotUsername = (username: string) =>
  username.startsWith("bot_");

export const countWerewolfBots = (players: WerewolfPlayer[]) =>
  players.filter((player) => player.isBot || isWerewolfBotUsername(player.username))
    .length;

export function createWerewolfBot(existing: WerewolfPlayer[]): WerewolfPlayer | null {
  if (existing.length >= MAX_PLAYERS) return null;

  const usedNames = new Set(existing.map((player) => player.displayName));
  const usedUsernames = new Set(existing.map((player) => player.username));

  let index = countWerewolfBots(existing) + 1;
  let username = `bot_${index}`;
  while (usedUsernames.has(username)) {
    index += 1;
    username = `bot_${index}`;
  }

  const displayName =
    BOT_NAMES.find((name) => !usedNames.has(name)) ?? `Bot ${index}`;

  return {
    username,
    displayName,
    avatarId: getDefaultWerewolfAvatarForUsername(username),
    avatarUrl: null,
    status: "alive",
    role: null,
    isHost: false,
    isBot: true,
  };
}

const pickRandom = <T,>(items: T[]): T | null => {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
};

export function fillBotNightActions(
  room: WerewolfRoomRecord,
  nightActions: Record<string, string> = room.nightActions
): Record<string, string> {
  const next = { ...nightActions };
  const pending = getPendingNightActors(room.players, next);

  for (const username of pending) {
    const actor = getPlayer(room.players, username);
    if (!actor || (!actor.isBot && !isWerewolfBotUsername(username))) continue;

    const candidates = getAlivePlayers(room.players)
      .map((player) => player.username)
      .filter((target) => isValidNightTarget(room, username, target));

    const target = pickRandom(candidates);
    if (target) next[username] = target;
  }

  return next;
}

export function fillBotVotes(
  room: WerewolfRoomRecord,
  votes: Record<string, string> = room.votes
): Record<string, string> {
  const next = { ...votes };
  const pending = getPendingVoters(room.players, next);

  for (const username of pending) {
    const voter = getPlayer(room.players, username);
    if (!voter || (!voter.isBot && !isWerewolfBotUsername(username))) continue;

    const candidates = getAlivePlayers(room.players)
      .map((player) => player.username)
      .filter((target) => isValidVoteTarget(room, username, target));

    // Wolves prefer voting non-wolves; villagers pick randomly.
    const pool =
      voter.role === "werewolf"
        ? (() => {
            const villagers = candidates.filter((target) => {
              const player = getPlayer(room.players, target);
              return player?.role !== "werewolf";
            });
            return villagers.length > 0 ? villagers : candidates;
          })()
        : candidates;

    const target = pickRandom(pool);
    if (target) next[username] = target;
  }

  return next;
}
