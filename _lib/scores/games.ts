import { admin } from "@/_lib/firebase/Admin";
import { defaultRowColorForIndex } from "./colors";

export { DEFAULT_ROW_COLORS, ROW_COLORS, defaultRowColorForIndex } from "./colors";

const db = admin.firestore();

export const SCORE_GAMES_COLLECTION = "scoreGames";
export const SCORE_ROOMS_COLLECTION = "scoreRooms";
export const SCORE_HISTORY_LIMIT = 50;

export interface ScoreHistoryEntry {
  id: string;
  memberUsername: string;
  memberDisplayName: string;
  previousScore: number;
  newScore: number;
  delta: number;
  changedByUsername: string;
  changedByDisplayName: string;
  createdAt: number;
}

export interface ScorePlayer {
  id: string;
  name: string;
  score: number;
  username?: string;
}

export interface ScoreGameRecord {
  id: string;
  userId: string;
  username: string;
  name: string;
  players: ScorePlayer[];
  createdAt: number;
  updatedAt: number;
}

export interface ScoreRoomMember {
  username: string;
  displayName: string;
  score: number;
  roundScore: number;
  rowColor?: string;
}

export interface ScoreRoomRecord {
  id: string;
  name: string;
  inviteCode: string;
  hostUsername: string;
  hostDisplayName: string;
  memberUsernames: string[];
  members: ScoreRoomMember[];
  roundNumber: number;
  createdAt: number;
  updatedAt: number;
}

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const serializeRoomMembers = (members: ScoreRoomMember[]) =>
  members.map((m, index) => ({
    username: m.username,
    displayName: m.displayName,
    score: m.score,
    roundScore: m.roundScore ?? 0,
    rowColor: m.rowColor ?? defaultRowColorForIndex(index),
  }));

export const generateInviteCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
};

export const getGameRef = (gameId: string) =>
  db.collection(SCORE_GAMES_COLLECTION).doc(gameId);

export const getRoomRef = (roomId: string) =>
  db.collection(SCORE_ROOMS_COLLECTION).doc(roomId);

export const getRoomHistoryCollection = (roomId: string) =>
  getRoomRef(roomId).collection("scoreHistory");

export const mapHistoryEntry = (
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): ScoreHistoryEntry => {
  const data = doc.data() ?? {};
  const previousScore = Number(data.previousScore ?? 0);
  const newScore = Number(data.newScore ?? 0);

  return {
    id: doc.id,
    memberUsername: String(data.memberUsername ?? ""),
    memberDisplayName: String(data.memberDisplayName ?? ""),
    previousScore,
    newScore,
    delta: Number(data.delta ?? newScore - previousScore),
    changedByUsername: String(data.changedByUsername ?? ""),
    changedByDisplayName: String(data.changedByDisplayName ?? ""),
    createdAt: Number(data.createdAt ?? 0),
  };
};

export const mapGame = (
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): ScoreGameRecord | null => {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const players = Array.isArray(data.players)
    ? data.players.map((p: Record<string, unknown>, index: number) => ({
        id: String(p.id ?? `player-${index}`),
        name: String(p.name ?? ""),
        score: Number(p.score ?? 0),
        username: p.username ? String(p.username) : undefined,
      }))
    : [];

  return {
    id: doc.id,
    userId: String(data.userId ?? ""),
    username: String(data.username ?? ""),
    name: String(data.name ?? ""),
    players,
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
};

export const mapRoom = (
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): ScoreRoomRecord | null => {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const memberUsernames = Array.isArray(data.memberUsernames)
    ? data.memberUsernames.map((v: unknown) => String(v))
    : [];

  const members = Array.isArray(data.members)
    ? data.members.map((m: Record<string, unknown>) => ({
        username: String(m.username ?? ""),
        displayName: String(m.displayName ?? m.username ?? ""),
        score: Number(m.score ?? 0),
        roundScore: Number(m.roundScore ?? 0),
        rowColor: m.rowColor ? String(m.rowColor) : undefined,
      }))
    : [];

  return {
    id: doc.id,
    name: String(data.name ?? ""),
    inviteCode: String(data.inviteCode ?? ""),
    hostUsername: String(data.hostUsername ?? ""),
    hostDisplayName: String(data.hostDisplayName ?? ""),
    memberUsernames,
    members,
    roundNumber: Number(data.roundNumber ?? 1),
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
};

export const createUniqueInviteCode = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await db
      .collection(SCORE_ROOMS_COLLECTION)
      .where("inviteCode", "==", code)
      .limit(1)
      .get();
    if (existing.empty) return code;
  }
  return generateInviteCode(8);
};
