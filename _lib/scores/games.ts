import { admin } from "@/_lib/firebase/Admin";

const db = admin.firestore();

export const SCORE_GAMES_COLLECTION = "scoreGames";
export const SCORE_ROOMS_COLLECTION = "scoreRooms";

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
}

export interface ScoreRoomRecord {
  id: string;
  name: string;
  inviteCode: string;
  hostUsername: string;
  hostDisplayName: string;
  memberUsernames: string[];
  members: ScoreRoomMember[];
  createdAt: number;
  updatedAt: number;
}

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
