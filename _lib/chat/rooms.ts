import { admin } from "@/_lib/firebase/Admin";

const db = admin.firestore();

export const PRIVATE_CHAT_ROOMS_COLLECTION = "privateChatRooms";
export const PRIVATE_CHAT_MESSAGE_LIMIT = 50;
export const PRIVATE_CHAT_TYPING_TTL_MS = 5000;
export const PRIVATE_CHAT_PRESENCE_COLLECTION = "privateChatPresence";
export const PRIVATE_CHAT_PRESENCE_TTL_MS = 20000;

export interface ChatRoomSummary {
  id: string;
  participantUsernames: string[];
  participantDisplayNames: string[];
  updatedAt: number;
  createdAt: number;
  lastMessageText: string;
  lastMessageAt: number;
  unreadCounts: Record<string, number>;
  lastReadAtBy: Record<string, number>;
}

export interface ChatMessageRecord {
  id: string;
  text: string;
  username: string;
  displayName: string;
  createdAt: number;
}

export interface ChatTypingUser {
  username: string;
  displayName: string;
  updatedAt: number;
}

export interface ChatPresenceRecord {
  username: string;
  displayName: string;
  isOnline: boolean;
  updatedAt: number;
  lastSeenAt: number;
}

export const getRoomIdForUsers = (firstUsername: string, secondUsername: string) =>
  [firstUsername, secondUsername].sort().join("__");

export const getRoomRef = (roomId: string) =>
  db.collection(PRIVATE_CHAT_ROOMS_COLLECTION).doc(roomId);

export const getRoomMessagesCollection = (roomId: string) =>
  getRoomRef(roomId).collection("messages");

export const getRoomTypingCollection = (roomId: string) =>
  getRoomRef(roomId).collection("typing");

export const getPresenceRef = (username: string) =>
  db.collection(PRIVATE_CHAT_PRESENCE_COLLECTION).doc(username);

export const mapRoom = (
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): ChatRoomSummary | null => {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();

  if (!data) {
    return null;
  }

  const participantUsernames = Array.isArray(data.participantUsernames)
    ? data.participantUsernames.map((value: unknown) => String(value))
    : [];
  const participantDisplayNames = Array.isArray(data.participantDisplayNames)
    ? data.participantDisplayNames.map((value: unknown) => String(value))
    : [];
  const unreadCounts =
    data.unreadCounts && typeof data.unreadCounts === "object"
      ? Object.fromEntries(
          Object.entries(data.unreadCounts).map(([key, value]) => [
            key,
            Number(value ?? 0),
          ])
        )
      : {};
  const lastReadAtBy =
    data.lastReadAtBy && typeof data.lastReadAtBy === "object"
      ? Object.fromEntries(
          Object.entries(data.lastReadAtBy).map(([key, value]) => [
            key,
            Number(value ?? 0),
          ])
        )
      : {};

  return {
    id: doc.id,
    participantUsernames,
    participantDisplayNames,
    updatedAt: Number(data.updatedAt ?? 0),
    createdAt: Number(data.createdAt ?? 0),
    lastMessageText: String(data.lastMessageText ?? ""),
    lastMessageAt: Number(data.lastMessageAt ?? 0),
    unreadCounts,
    lastReadAtBy,
  };
};

export const mapMessage = (
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): ChatMessageRecord => {
  const data = doc.data();

  return {
    id: doc.id,
    text: String(data.text ?? ""),
    username: String(data.username ?? ""),
    displayName: String(data.displayName ?? data.username ?? ""),
    createdAt: Number(data.createdAt ?? 0),
  };
};

export const mapTypingUser = (
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): ChatTypingUser => {
  const data = doc.data();

  return {
    username: String(data.username ?? doc.id),
    displayName: String(data.displayName ?? data.username ?? doc.id),
    updatedAt: Number(data.updatedAt ?? 0),
  };
};

export const mapPresenceRecord = (
  doc:
    | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): ChatPresenceRecord | null => {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();

  if (!data) {
    return null;
  }

  return {
    username: String(data.username ?? doc.id),
    displayName: String(data.displayName ?? data.username ?? doc.id),
    isOnline: Boolean(data.isOnline),
    updatedAt: Number(data.updatedAt ?? 0),
    lastSeenAt: Number(data.lastSeenAt ?? 0),
  };
};

export const ensurePrivateRoom = async ({
  currentUsername,
  currentDisplayName,
  otherUsername,
  otherDisplayName,
}: {
  currentUsername: string;
  currentDisplayName: string;
  otherUsername: string;
  otherDisplayName: string;
}) => {
  const roomId = getRoomIdForUsers(currentUsername, otherUsername);
  const roomRef = getRoomRef(roomId);
  const existingRoom = await roomRef.get();

  if (!existingRoom.exists) {
    const now = Date.now();
    await roomRef.set({
      participantUsernames: [currentUsername, otherUsername].sort(),
      participantDisplayNames:
        currentUsername < otherUsername
          ? [currentDisplayName, otherDisplayName]
          : [otherDisplayName, currentDisplayName],
      createdAt: now,
      updatedAt: now,
      lastMessageText: "",
      lastMessageAt: 0,
      unreadCounts: {
        [currentUsername]: 0,
        [otherUsername]: 0,
      },
      lastReadAtBy: {
        [currentUsername]: now,
        [otherUsername]: now,
      },
    });
  }

  return roomId;
};
