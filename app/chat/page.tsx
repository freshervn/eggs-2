import LogoutButton from "../_components/LogoutButton";
import { readSession } from "@/_lib/auth/session";
import {
  mapMessage,
  mapRoom,
  PRIVATE_CHAT_MESSAGE_LIMIT,
  PRIVATE_CHAT_ROOMS_COLLECTION,
} from "@/_lib/chat/rooms";
import { admin } from "@/_lib/firebase/Admin";
import Link from "next/link";
import { redirect } from "next/navigation";
import ChatRoom, { ChatMessage, ChatRoomSummary } from "./_components/ChatRoom";

const db = admin.firestore();

export default async function ChatPage() {
  const session = await readSession();

  if (!session) {
    redirect("/login?next=/chat");
  }

  const roomsSnapshot = await db
    .collection(PRIVATE_CHAT_ROOMS_COLLECTION)
    .where("participantUsernames", "array-contains", session.username)
    .get();

  const initialRooms: ChatRoomSummary[] = roomsSnapshot.docs
    .map(mapRoom)
    .filter((room): room is ChatRoomSummary => room !== null)
    .sort((left, right) => right.updatedAt - left.updatedAt);

  const initialRoomId = initialRooms[0]?.id ?? "";
  const initialMessages: ChatMessage[] = initialRoomId
    ? (
        await db
          .collection(PRIVATE_CHAT_ROOMS_COLLECTION)
          .doc(initialRoomId)
          .collection("messages")
          .orderBy("createdAt", "desc")
          .limit(PRIVATE_CHAT_MESSAGE_LIMIT)
          .get()
      ).docs
        .map(mapMessage)
        .reverse()
    : [];

  return (
    <div className="bg-slate-50">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            Home
          </Link>
          <div className="text-sm text-slate-500">
            Signed in as {session.displayName}
          </div>
        </div>
        <LogoutButton nextPath="/chat" />
      </div>
      <ChatRoom
        initialMessages={initialMessages}
        initialRooms={initialRooms}
        currentUsername={session.username}
        currentDisplayName={session.displayName}
      />
    </div>
  );
}
