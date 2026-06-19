import type { Metadata } from "next";
import { readSession } from "@/_lib/auth/session";
import {
  mapRoom,
  defaultRowColorForIndex,
  serializeRoomMembers,
  SCORE_ROOMS_COLLECTION,
} from "@/_lib/scores/games";
import { admin } from "@/_lib/firebase/Admin";
import ScoreBoard, { type ScoreRoom } from "./_components/ScoreBoard";

export const metadata: Metadata = {
  title: "Tính điểm",
  description: "Tạo bảng điểm và phòng chung với bạn bè.",
};

const db = admin.firestore();

export default async function TinhDiemPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const session = await readSession();
  const params = await searchParams;
  const inviteCode = params.room?.trim().toUpperCase() ?? "";

  let initialRooms: ScoreRoom[] = [];
  let initialRoomId = "";

  if (session) {
    const roomsSnap = await db
      .collection(SCORE_ROOMS_COLLECTION)
      .where("memberUsernames", "array-contains", session.username)
      .get();

    initialRooms = roomsSnap.docs
      .map(mapRoom)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((r) => ({
        id: r.id,
        name: r.name,
        inviteCode: r.inviteCode,
        hostUsername: r.hostUsername,
        hostDisplayName: r.hostDisplayName,
        memberUsernames: r.memberUsernames,
        roundNumber: r.roundNumber,
        members: r.members,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

    if (inviteCode) {
      const inviteSnap = await db
        .collection(SCORE_ROOMS_COLLECTION)
        .where("inviteCode", "==", inviteCode)
        .limit(1)
        .get();

      if (!inviteSnap.empty) {
        const roomDoc = inviteSnap.docs[0];
        const room = mapRoom(roomDoc);
        if (room) {
          if (!room.memberUsernames.includes(session.username)) {
            const now = Date.now();
            await roomDoc.ref.update({
              memberUsernames: [...room.memberUsernames, session.username],
              members: serializeRoomMembers([
                ...room.members,
                {
                  username: session.username,
                  displayName: session.displayName,
                  score: 0,
                  roundScore: 0,
                  rowColor: defaultRowColorForIndex(room.members.length),
                },
              ]),
              updatedAt: now,
            });
            initialRoomId = roomDoc.id;
          } else {
            initialRoomId = room.id;
          }
        }
      }
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto w-full max-w-md">
        <ScoreBoard
          initialRooms={initialRooms}
          session={
            session
              ? { username: session.username, displayName: session.displayName }
              : null
          }
          initialRoomId={initialRoomId}
          initialInviteCode={!session && inviteCode ? inviteCode : undefined}
        />
      </div>
    </div>
  );
}
