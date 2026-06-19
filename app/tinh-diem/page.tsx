import Link from "next/link";
import type { Metadata } from "next";
import { readSession } from "@/_lib/auth/session";
import {
  mapRoom,
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
              members: [
                ...room.members,
                {
                  username: session.username,
                  displayName: session.displayName,
                  score: 0,
                },
              ],
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
    <div className="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200/80 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← Trang chủ
        </Link>

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Tính điểm
          </h1>
        </header>

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
