import { admin } from "@/_lib/firebase/Admin";
import {
  CUSTOM_WEREWOLF_AVATAR_ID,
  normalizeWerewolfAvatarId,
  normalizeWerewolfAvatarUrl,
} from "./avatars";
import { generateInviteCode, WEREWOLF_ROOMS_COLLECTION } from "./game";
import {
  normalizeWerewolfSettings,
  serializeWerewolfSettings,
} from "./settings";
import { WerewolfPhase, WerewolfPlayer, WerewolfRole, WerewolfRoomRecord } from "./types";

const db = admin.firestore();

export const getRoomRef = (roomId: string) =>
  db.collection(WEREWOLF_ROOMS_COLLECTION).doc(roomId);

export const mapPlayer = (value: unknown): WerewolfPlayer | null => {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const username = String(data.username ?? "").trim();
  if (!username) return null;

  const role = data.role;
  const validRoles: WerewolfRole[] = ["werewolf", "villager", "seer", "doctor"];
  const avatarUrl = normalizeWerewolfAvatarUrl(data.avatarUrl);
  const avatarId = avatarUrl
    ? CUSTOM_WEREWOLF_AVATAR_ID
    : normalizeWerewolfAvatarId(data.avatarId);

  return {
    username,
    displayName: String(data.displayName ?? username),
    avatarId,
    avatarUrl,
    status: data.status === "dead" ? "dead" : "alive",
    role: validRoles.includes(role as WerewolfRole) ? (role as WerewolfRole) : null,
    isHost: Boolean(data.isHost),
    isBot: Boolean(data.isBot) || username.startsWith("bot_"),
  };
};

export const serializePlayers = (players: WerewolfPlayer[]) =>
  players.map((player) => ({
    username: player.username,
    displayName: player.displayName,
    avatarId: player.avatarId,
    avatarUrl: player.avatarUrl,
    status: player.status,
    role: player.role,
    isHost: player.isHost,
    isBot: Boolean(player.isBot),
  }));

const mapStringRecord = (value: unknown) => {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, String(entry ?? "")])
  );
};

const mapRoleRecord = (value: unknown) => {
  if (!value || typeof value !== "object") return {};
  const validRoles: WerewolfRole[] = ["werewolf", "villager", "seer", "doctor"];
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, entry]) => [key, String(entry ?? "")] as const)
      .filter(([, role]) => validRoles.includes(role as WerewolfRole))
      .map(([key, role]) => [key, role as WerewolfRole])
  );
};

const validPhases: WerewolfPhase[] = ["lobby", "night", "day", "voting", "ended"];

export const mapRoom = (
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): WerewolfRoomRecord | null => {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const players = Array.isArray(data.players)
    ? data.players.map(mapPlayer).filter((player): player is WerewolfPlayer => player !== null)
    : [];

  const phase = validPhases.includes(data.phase as WerewolfPhase)
    ? (data.phase as WerewolfPhase)
    : "lobby";

  const phaseEndsAtRaw = Number(data.phaseEndsAt ?? 0);

  return {
    id: doc.id,
    name: String(data.name ?? "Ma Sói"),
    inviteCode: String(data.inviteCode ?? ""),
    hostUsername: String(data.hostUsername ?? ""),
    hostDisplayName: String(data.hostDisplayName ?? ""),
    phase,
    dayNumber: Number(data.dayNumber ?? 0),
    players,
    nightActions: mapStringRecord(data.nightActions),
    votes: mapStringRecord(data.votes),
    seerResults: mapRoleRecord(data.seerResults),
    winner:
      data.winner === "werewolves" || data.winner === "villagers" ? data.winner : null,
    lastEvent: String(data.lastEvent ?? ""),
    protectedUsername: data.protectedUsername ? String(data.protectedUsername) : null,
    settings: normalizeWerewolfSettings(data.settings),
    phaseEndsAt: phaseEndsAtRaw > 0 ? phaseEndsAtRaw : null,
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
};

export { serializeWerewolfSettings };

export const createUniqueInviteCode = async () => {
  for (let attempt = 0; attempt < 12; attempt++) {
    const inviteCode = generateInviteCode();
    const existing = await db
      .collection(WEREWOLF_ROOMS_COLLECTION)
      .where("inviteCode", "==", inviteCode)
      .limit(1)
      .get();
    if (existing.empty) return inviteCode;
  }
  throw new Error("Failed to generate invite code.");
};
