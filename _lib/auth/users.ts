import { admin } from "@/_lib/firebase/Admin";
import { normalizeUsername, validateUsername } from "./password";

const USERS_COLLECTION = "users";

export interface StoredUser {
  id: string;
  username: string;
  usernameKey: string;
  displayName: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  createdAt: number;
}

interface CreateUserInput {
  username: string;
  passwordHash: string;
  displayName?: string;
}

const db = admin.firestore();

const toStoredUser = (
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): StoredUser | null => {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();

  if (!data) {
    return null;
  }

  return {
    id: doc.id,
    username: String(data.username ?? doc.id),
    usernameKey: String(data.usernameKey ?? doc.id),
    displayName: String(data.displayName ?? data.username ?? doc.id),
    passwordHash: String(data.passwordHash ?? ""),
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
};

export const toPublicUser = (user: StoredUser): PublicUser => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  createdAt: user.createdAt,
});

export const getUserByUsername = async (username: string) => {
  const usernameKey = normalizeUsername(username);
  const snapshot = await db.collection(USERS_COLLECTION).doc(usernameKey).get();
  return toStoredUser(snapshot);
};

export const listPublicUsers = async (): Promise<PublicUser[]> => {
  const snapshot = await db.collection(USERS_COLLECTION).get();

  return snapshot.docs
    .map((doc) => toStoredUser(doc))
    .filter((user): user is StoredUser => user !== null)
    .map(toPublicUser)
    .sort((left, right) => left.username.localeCompare(right.username));
};

export const createUser = async ({
  username,
  passwordHash,
  displayName,
}: CreateUserInput) => {
  const usernameKey = validateUsername(username);
  const userRef = db.collection(USERS_COLLECTION).doc(usernameKey);
  const existingUser = await userRef.get();

  if (existingUser.exists) {
    throw new Error("Username is already taken.");
  }

  const now = Date.now();
  const nextUser: Omit<StoredUser, "id"> = {
    username: usernameKey,
    usernameKey,
    displayName: displayName?.trim() || usernameKey,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  await userRef.set(nextUser);

  return {
    id: userRef.id,
    ...nextUser,
  };
};
