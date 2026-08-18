import { getDefaultWerewolfAvatarForUsername } from "./avatars";
import type { WerewolfRole, WerewolfRoomView } from "./types";

export type DevScreen =
  | "home"
  | "create"
  | "join"
  | "lobby"
  | "lobby-full"
  | "night-wolf"
  | "night-seer"
  | "night-doctor"
  | "night-villager"
  | "day"
  | "day-guest"
  | "voting"
  | "ended-wolves"
  | "ended-villagers"
  | "dead";

export const DEV_SCREENS: { id: DevScreen; label: string }[] = [
  { id: "home", label: "Chọn phòng" },
  { id: "create", label: "Tạo phòng" },
  { id: "join", label: "Tham gia" },
  { id: "lobby", label: "Lobby (chờ)" },
  { id: "lobby-full", label: "Lobby (đủ người)" },
  { id: "night-wolf", label: "Đêm · Ma Sói" },
  { id: "night-seer", label: "Đêm · Tiên Tri" },
  { id: "night-doctor", label: "Đêm · Bác Sĩ" },
  { id: "night-villager", label: "Đêm · Dân" },
  { id: "day", label: "Ngày (chủ phòng)" },
  { id: "day-guest", label: "Ngày (khách)" },
  { id: "voting", label: "Bỏ phiếu" },
  { id: "ended-wolves", label: "Kết thúc · Sói thắng" },
  { id: "ended-villagers", label: "Kết thúc · Dân thắng" },
  { id: "dead", label: "Đã chết (xem vai)" },
];

const BOT_PLAYERS = [
  { username: "dev_bot_1", displayName: "Lan" },
  { username: "dev_bot_2", displayName: "Hùng" },
  { username: "dev_bot_3", displayName: "Mai" },
  { username: "dev_bot_4", displayName: "Tuấn" },
  { username: "dev_bot_5", displayName: "Vy" },
];

const ROLE_MAP: Record<string, WerewolfRole> = {
  dev_me: "werewolf",
  dev_bot_1: "werewolf",
  dev_bot_2: "villager",
  dev_bot_3: "seer",
  dev_bot_4: "doctor",
  dev_bot_5: "villager",
};

export const isDevScreen = (value: string | null): value is DevScreen =>
  DEV_SCREENS.some((screen) => screen.id === value);

export const createDevMockRoom = (
  screen: DevScreen,
  playerUsername: string,
  playerDisplayName: string,
  playerAvatarId?: string,
  playerAvatarUrl?: string | null
): WerewolfRoomView | null => {
  if (screen === "home" || screen === "create" || screen === "join") {
    return null;
  }

  const now = Date.now();
  const meUsername = playerUsername || "dev_me";
  const meDisplayName = playerDisplayName || "Tester";
  const hostUsername = screen === "day-guest" ? "dev_bot_1" : meUsername;

  const allPlayers = [
    {
      username: meUsername,
      displayName: meDisplayName,
      avatarId: playerAvatarId ?? getDefaultWerewolfAvatarForUsername(meUsername),
      avatarUrl: playerAvatarUrl ?? null,
      status: screen === "dead" ? ("dead" as const) : ("alive" as const),
      isHost: meUsername === hostUsername,
      isBot: false,
    },
    ...BOT_PLAYERS.map((bot, index) => ({
      username: bot.username,
      displayName: bot.displayName,
      avatarId: getDefaultWerewolfAvatarForUsername(bot.username),
      avatarUrl: null,
      status:
        screen === "dead" && index === 0
          ? ("dead" as const)
          : ("alive" as const),
      isHost: bot.username === hostUsername,
      isBot: true,
    })),
  ];

  const players =
    screen === "lobby"
      ? allPlayers.slice(0, 2)
      : screen === "lobby-full"
        ? allPlayers
        : allPlayers;

  const roleFor = (username: string): WerewolfRole | null => {
    if (screen.startsWith("lobby")) return null;
    if (username === meUsername) {
      if (screen === "night-wolf" || screen === "ended-wolves") return "werewolf";
      if (screen === "night-seer") return "seer";
      if (screen === "night-doctor") return "doctor";
      if (screen === "dead" || screen === "day-guest" || screen === "night-villager")
        return "villager";
      return "werewolf";
    }
    return ROLE_MAP[username] ?? "villager";
  };

  const myRole = roleFor(meUsername);
  const knownRoles: Record<string, WerewolfRole> = {};
  const seerResults: Record<string, WerewolfRole> = {};

  if (myRole === "werewolf" || screen === "dead") {
    for (const player of players) {
      const role = roleFor(player.username);
      if (role === "werewolf") knownRoles[player.username] = "werewolf";
    }
  }
  if (myRole) knownRoles[meUsername] = myRole;

  if (screen === "dead") {
    for (const player of players) {
      const role = roleFor(player.username);
      if (role) knownRoles[player.username] = role;
    }
  }

  if (myRole === "seer" || screen === "dead") {
    seerResults["dev_bot_2"] = "villager";
    seerResults["dev_bot_4"] = "doctor";
  }

  const phase =
    screen.startsWith("lobby")
      ? "lobby"
      : screen.startsWith("night")
        ? "night"
        : screen.startsWith("day")
          ? "day"
          : screen === "voting"
            ? "voting"
            : screen.startsWith("ended")
              ? "ended"
              : "day";

  const winner =
    screen === "ended-wolves"
      ? "werewolves"
      : screen === "ended-villagers"
        ? "villagers"
        : null;

  const lastEvent =
    screen === "lobby"
      ? "Chờ người chơi tham gia..."
      : screen === "lobby-full"
        ? "Đủ người — chủ phòng có thể bắt đầu."
        : screen.startsWith("night")
          ? "Ban đêm — chọn mục tiêu của bạn."
          : screen.startsWith("day")
            ? "Mai đã bị ma sói tấn công và chết trong đêm."
            : screen === "voting"
              ? "Dân làng bắt đầu bỏ phiếu loại nghi phạm."
              : screen === "ended-wolves"
                ? "Ma Sói đã chiếm ưu thế!"
                : screen === "ended-villagers"
                  ? "Tất cả Ma Sói đã bị loại!"
                  : screen === "dead"
                    ? "Bạn đã bị loại — xem vai trò mọi người."
                    : "";

  const pendingNightActors =
    phase === "night" && myRole && ["werewolf", "seer", "doctor"].includes(myRole)
      ? screen === "night-villager"
        ? []
        : [meUsername]
      : [];

  const pendingVoters = phase === "voting" ? [meUsername, "dev_bot_2"] : [];

  return {
    id: "dev-mock-room",
    name: "[DEV] Phòng test",
    inviteCode: "DEV123",
    hostUsername,
    hostDisplayName: screen === "day-guest" ? "Lan" : meDisplayName,
    phase,
    dayNumber: phase === "lobby" ? 0 : 2,
    players,
    myRole,
    knownRoles,
    seerResults,
    nightActions: {},
    votes: {},
    winner,
    lastEvent,
    protectedUsername: phase === "day" ? "dev_bot_4" : null,
    settings: {
      nightDurationSec: 0,
      dayDurationSec: 180,
      voteDurationSec: 90,
      enableSeer: true,
      enableDoctor: true,
      wolfCount: 0,
      revealRolesAtEnd: true,
    },
    phaseEndsAt: null,
    pendingNightActors,
    pendingVoters,
    canStart: screen === "lobby-full",
    createdAt: now,
    updatedAt: now,
  };
};
