import type { Metadata } from "next";
import { readSession } from "@/_lib/auth/session";
import { getDefaultWerewolfAvatarForUsername } from "@/_lib/werewolf/avatars";
import { mapRoom, serializePlayers } from "@/_lib/werewolf/rooms";
import { WEREWOLF_ROOMS_COLLECTION } from "@/_lib/werewolf/game";
import { admin } from "@/_lib/firebase/Admin";
import { isDevScreen, type DevScreen } from "@/_lib/werewolf/dev-mock";
import WerewolfGame from "./_components/WerewolfGame";

export const metadata: Metadata = {
  title: "Ma Sói Online",
  description: "Chơi Ma Sói trực tuyến với bạn bè.",
};

const db = admin.firestore();

export default async function WerewolfPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; dev?: string }>;
}) {
  const session = await readSession();
  const params = await searchParams;
  const inviteCode = params.room?.trim().toUpperCase() ?? "";
  const initialDevScreen =
    process.env.NODE_ENV === "development" && isDevScreen(params.dev ?? null)
      ? (params.dev as DevScreen)
      : undefined;
  let initialRoomId = "";

  if (session && inviteCode) {
    const inviteSnap = await db
      .collection(WEREWOLF_ROOMS_COLLECTION)
      .where("inviteCode", "==", inviteCode)
      .limit(1)
      .get();

    if (!inviteSnap.empty) {
      const roomDoc = inviteSnap.docs[0];
      const room = mapRoom(roomDoc);

      if (room) {
        if (!room.players.some((player) => player.username === session.username)) {
          if (room.phase === "lobby" && room.players.length < 12) {
            const now = Date.now();
            const nextPlayers = [
              ...room.players,
              {
                username: session.username,
                displayName: session.displayName,
                avatarId: getDefaultWerewolfAvatarForUsername(session.username),
                avatarUrl: null,
                status: "alive" as const,
                role: null,
                isHost: false,
                isBot: false,
              },
            ];

            await roomDoc.ref.update({
              players: serializePlayers(nextPlayers),
              playerUsernames: [
                ...room.players.map((player) => player.username),
                session.username,
              ],
              updatedAt: now,
              lastEvent: `${session.displayName} đã tham gia phòng.`,
            });
          }
        }
        initialRoomId = roomDoc.id;
      }
    }
  }

  return (
    <WerewolfGame
      session={
        session
          ? { username: session.username, displayName: session.displayName }
          : null
      }
      initialRoomId={initialRoomId}
      initialInviteCode={!session && inviteCode ? inviteCode : undefined}
      initialDevScreen={initialDevScreen}
    />
  );
}
