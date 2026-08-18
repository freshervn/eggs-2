import { getRoomRef } from "./rooms";
import type { WerewolfChatChannel, WerewolfChatMessage } from "./chat-rules";

export {
  WEREWOLF_CHAT_MESSAGE_LIMIT,
  WEREWOLF_CHAT_MAX_LENGTH,
  canSendChat,
  canViewChatMessage,
  filterVisibleChatMessages,
  type WerewolfChatChannel,
  type WerewolfChatMessage,
} from "./chat-rules";

export const getRoomMessagesCollection = (roomId: string) =>
  getRoomRef(roomId).collection("messages");

export const mapChatMessage = (
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): WerewolfChatMessage => {
  const data = doc.data();
  const channelRaw = String(data.channel ?? "public");
  const channel: WerewolfChatChannel =
    channelRaw === "wolves" ? "wolves" : "public";

  return {
    id: doc.id,
    text: String(data.text ?? ""),
    username: String(data.username ?? ""),
    displayName: String(data.displayName ?? data.username ?? ""),
    channel,
    createdAt: Number(data.createdAt ?? 0),
  };
};
