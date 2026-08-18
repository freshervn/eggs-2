import { getPlayer } from "./game";
import type { WerewolfRoomRecord } from "./types";

export const WEREWOLF_CHAT_MESSAGE_LIMIT = 80;
export const WEREWOLF_CHAT_MAX_LENGTH = 280;

export type WerewolfChatChannel = "public" | "wolves";

export interface WerewolfChatMessage {
  id: string;
  text: string;
  username: string;
  displayName: string;
  channel: WerewolfChatChannel;
  createdAt: number;
}

export const canSendChat = (
  room: WerewolfRoomRecord,
  username: string
): { allowed: boolean; reason: string; channel: WerewolfChatChannel | null } => {
  const player = getPlayer(room.players, username);
  if (!player) {
    return { allowed: false, reason: "Bạn không ở trong phòng.", channel: null };
  }

  if (room.phase === "lobby" || room.phase === "ended") {
    return { allowed: true, reason: "", channel: "public" };
  }

  if (player.status === "dead") {
    return { allowed: false, reason: "Người chết không thể nói.", channel: null };
  }

  if (room.phase === "night") {
    if (player.role === "werewolf") {
      return { allowed: true, reason: "", channel: "wolves" };
    }
    return {
      allowed: false,
      reason: "Ban đêm — chỉ Ma Sói được nói riêng.",
      channel: null,
    };
  }

  if (room.phase === "day" || room.phase === "voting") {
    return { allowed: true, reason: "", channel: "public" };
  }

  return { allowed: false, reason: "Không thể gửi tin nhắn lúc này.", channel: null };
};

export const canViewChatMessage = (
  room: WerewolfRoomRecord,
  username: string,
  channel: WerewolfChatChannel
) => {
  if (channel !== "wolves") return true;
  const player = getPlayer(room.players, username);
  if (!player) return false;
  return player.role === "werewolf" || player.status === "dead";
};

export const filterVisibleChatMessages = (
  room: WerewolfRoomRecord,
  username: string,
  messages: WerewolfChatMessage[]
) =>
  messages.filter((message) =>
    canViewChatMessage(room, username, message.channel)
  );
