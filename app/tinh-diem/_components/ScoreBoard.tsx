"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

export interface ScoreRoomMember {
  username: string;
  displayName: string;
  score: number;
}

export interface ScoreRoom {
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

interface SessionInfo {
  username: string;
  displayName: string;
}

interface ScoreBoardProps {
  initialRooms: ScoreRoom[];
  session: SessionInfo | null;
  initialRoomId?: string;
  initialInviteCode?: string;
}

type View = "home" | "join-room" | "create-room" | "room";

const GUEST_ID_KEY = "tinh-diem-guest-id";
const GUEST_NAME_KEY = "tinh-diem-guest-name";
const LOCAL_ROOMS_KEY = "tinh-diem-local-rooms";

const BAR_COLORS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-fuchsia-500",
  "bg-orange-500",
];

function createGuestId() {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  return `guest_${suffix}`;
}

function loadLocalRooms(): ScoreRoom[] {
  try {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreRoom[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalRoom(room: ScoreRoom) {
  const existing = loadLocalRooms();
  const next = [room, ...existing.filter((r) => r.id !== room.id)].slice(0, 20);
  localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(next));
}

function ScoreBar({
  name,
  score,
  maxScore,
  colorClass,
  isOwn,
  onScoreChange,
}: {
  name: string;
  score: number;
  maxScore: number;
  colorClass: string;
  isOwn?: boolean;
  onScoreChange?: (score: number) => void;
}) {
  const width = maxScore > 0 ? Math.max(4, (Math.abs(score) / maxScore) * 100) : 4;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate font-medium text-slate-900">
          {name}
          {isOwn && (
            <span className="ml-2 text-xs font-normal text-sky-600">(bạn)</span>
          )}
        </span>
        {onScoreChange ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onScoreChange(score - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
            >
              −
            </button>
            <input
              type="number"
              value={score}
              onChange={(e) => onScoreChange(Number(e.target.value) || 0)}
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm text-slate-900"
            />
            <button
              type="button"
              onClick={() => onScoreChange(score + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
            >
              +
            </button>
          </div>
        ) : (
          <span className="shrink-0 text-lg font-semibold tabular-nums text-slate-900">
            {score}
          </span>
        )}
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function HomeButton({
  label,
  description,
  accentClass,
  onClick,
}: {
  label: string;
  description: string;
  accentClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col rounded-2xl border border-slate-200 border-l-4 bg-white py-5 pl-5 pr-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${accentClass}`}
    >
      <span className="text-lg font-semibold text-slate-900">{label}</span>
      <span className="mt-1 text-sm leading-snug text-slate-600">{description}</span>
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900"
    >
      ← Quay lại
    </button>
  );
}

export default function ScoreBoard({
  initialRooms,
  session,
  initialRoomId,
  initialInviteCode,
}: ScoreBoardProps) {
  const [view, setView] = useState<View>(initialRoomId ? "room" : "home");
  const [guestId, setGuestId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [rooms, setRooms] = useState<ScoreRoom[]>(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId ?? "");
  const [activeRoom, setActiveRoom] = useState<ScoreRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState(initialInviteCode ?? "");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const playerUsername = session?.username ?? guestId;
  const hasName = Boolean(session || guestName.trim());

  const playerBody = useCallback(() => {
    if (session) return {};
    return { guestId, displayName: guestName };
  }, [session, guestId, guestName]);

  const maxScore = useMemo(() => {
    if (view === "room" && activeRoom) {
      return Math.max(1, ...activeRoom.members.map((m) => Math.abs(m.score)));
    }
    return 1;
  }, [view, activeRoom]);

  useEffect(() => {
    if (session) {
      setReady(true);
      return;
    }

    let id = localStorage.getItem(GUEST_ID_KEY) ?? "";
    if (!id.startsWith("guest_")) {
      id = createGuestId();
      localStorage.setItem(GUEST_ID_KEY, id);
    }

    const savedName = localStorage.getItem(GUEST_NAME_KEY) ?? "";
    setGuestId(id);
    setGuestName(savedName);
    setNameInput(savedName);

    const localRooms = loadLocalRooms();
    if (localRooms.length > 0) {
      setRooms((prev) => {
        const merged = [...prev];
        for (const room of localRooms) {
          if (!merged.some((r) => r.id === room.id)) merged.push(room);
        }
        return merged.sort((a, b) => b.updatedAt - a.updatedAt);
      });
    }

    setReady(true);
  }, [session]);

  useEffect(() => {
    if (!ready || !initialRoomId) return;
    if (session) {
      const room = initialRooms.find((r) => r.id === initialRoomId);
      if (room) setActiveRoom(room);
      return;
    }
    if (hasName) {
      fetch(`/api/scores/rooms/${initialRoomId}?guestId=${encodeURIComponent(guestId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.room) {
            setActiveRoom(data.room);
            saveLocalRoom(data.room);
          }
        })
        .catch(() => {});
    }
  }, [ready, initialRoomId, session, initialRooms, hasName, guestId]);

  useEffect(() => {
    if (!ready || !initialInviteCode || initialRoomId || !hasName) return;

    const joinByInvite = async () => {
      const res = await fetch("/api/scores/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: initialInviteCode,
          ...playerBody(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRooms((prev) => {
          const exists = prev.some((r) => r.id === data.room.id);
          return exists
            ? prev.map((r) => (r.id === data.room.id ? data.room : r))
            : [data.room, ...prev];
        });
        setActiveRoomId(data.room.id);
        setActiveRoom(data.room);
        saveLocalRoom(data.room);
        setView("room");
      }
    };

    joinByInvite();
  }, [ready, initialInviteCode, initialRoomId, hasName, playerBody]);

  useEffect(() => {
    if (!activeRoomId || !playerUsername) {
      if (view !== "room") setActiveRoom(null);
      return;
    }

    const guestQuery = session
      ? ""
      : `?guestId=${encodeURIComponent(guestId)}`;
    const source = new EventSource(
      `/api/scores/rooms/${activeRoomId}/stream${guestQuery}`
    );
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { room?: ScoreRoom };
        if (data.room) {
          setActiveRoom(data.room);
          setRooms((prev) => {
            const exists = prev.some((r) => r.id === data.room!.id);
            const next = exists
              ? prev.map((r) => (r.id === data.room!.id ? data.room! : r))
              : [data.room!, ...prev];
            if (!session) saveLocalRoom(data.room!);
            return next;
          });
        }
      } catch {
        /* ignore */
      }
    };

    return () => source.close();
  }, [activeRoomId, playerUsername, session, guestId, view]);

  const saveGuestName = (e: FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) {
      setError("Vui lòng nhập tên.");
      return;
    }
    localStorage.setItem(GUEST_NAME_KEY, name);
    setGuestName(name);
    setError("");
  };

  const ensureName = (action: View) => {
    if (!hasName) {
      setError("Nhập tên của bạn trước.");
      return false;
    }
    setView(action);
    setError("");
    return true;
  };

  const rememberRoom = (room: ScoreRoom) => {
    setRooms((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      const next = exists
        ? prev.map((r) => (r.id === room.id ? room : r))
        : [room, ...prev];
      if (!session) saveLocalRoom(room);
      return next;
    });
    setActiveRoomId(room.id);
    setActiveRoom(room);
  };

  const openRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    setActiveRoomId(roomId);
    if (room) setActiveRoom(room);
    setView("room");
  };

  const createRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasName) return;
    setError("");
    const res = await fetch("/api/scores/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRoomName.trim() || "Phòng điểm",
        ...playerBody(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không tạo được phòng.");
      return;
    }
    rememberRoom(data.room as ScoreRoom);
    setNewRoomName("");
    setView("room");
  };

  const joinRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasName) return;
    setError("");
    const res = await fetch("/api/scores/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteCode: joinCode.trim(),
        ...playerBody(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không tham gia được phòng.");
      return;
    }
    rememberRoom(data.room as ScoreRoom);
    setJoinCode("");
    setView("room");
  };

  const updateOwnRoomScore = async (score: number) => {
    if (!playerUsername || !activeRoomId) return;
    const res = await fetch(`/api/scores/rooms/${activeRoomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, ...playerBody() }),
    });
    const data = await res.json();
    if (res.ok && data.room) setActiveRoom(data.room);
  };

  const copyInviteLink = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}/tinh-diem?room=${activeRoom.inviteCode}`;
    navigator.clipboard.writeText(url);
  };

  if (!ready) {
    return <p className="text-center text-sm text-slate-500">Đang tải…</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {view === "home" && (
        <div className="space-y-4">
          {session ? (
            <p className="text-center text-sm text-slate-500">
              Xin chào,{" "}
              <span className="font-medium text-slate-700">{session.displayName}</span>
            </p>
          ) : (
            <form
              onSubmit={saveGuestName}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tên của bạn
              </label>
              <div className="flex gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="VD: Minh"
                  maxLength={30}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  {guestName ? "Đổi" : "OK"}
                </button>
              </div>
              {guestName && (
                <p className="mt-2 text-xs text-slate-500">
                  Đang chơi với tên <span className="font-medium">{guestName}</span>
                </p>
              )}
            </form>
          )}

          <nav className="flex flex-col gap-3" aria-label="Tính điểm">
            <HomeButton
              label="Chọn phòng"
              description="Nhập mã mời hoặc chọn phòng đã tham gia"
              accentClass="border-l-violet-500"
              onClick={() => ensureName("join-room")}
            />
            <HomeButton
              label="Tạo phòng"
              description="Mở phòng mới và mời bạn bè"
              accentClass="border-l-emerald-500"
              onClick={() => ensureName("create-room")}
            />
          </nav>

          {!session && (
            <p className="text-center text-xs text-slate-400">
              <Link href="/login?next=/tinh-diem" className="text-sky-600 hover:underline">
                Đăng nhập
              </Link>{" "}
              nếu muốn lưu phòng lâu dài
            </p>
          )}
        </div>
      )}

      {view === "join-room" && (
        <div>
          <BackButton onClick={() => setView("home")} />
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Chọn phòng</h2>

          <form
            onSubmit={joinRoom}
            className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <label className="block text-sm font-medium text-slate-700">Nhập mã mời</label>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="VD: ABC123"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center font-mono text-lg tracking-widest text-slate-900 uppercase placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              Vào phòng
            </button>
          </form>

          {rooms.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-slate-500">Phòng của bạn</h3>
              <ul className="space-y-2">
                {rooms.map((room) => (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => openRoom(room.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:border-violet-300"
                    >
                      <p className="font-medium text-slate-900">{room.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Mã {room.inviteCode}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {view === "create-room" && (
        <div>
          <BackButton onClick={() => setView("home")} />
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Tạo phòng</h2>

          <form
            onSubmit={createRoom}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tên phòng</label>
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="VD: Tối thứ 6"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Tạo phòng
            </button>
          </form>
        </div>
      )}

      {view === "room" && (
        <div>
          <BackButton onClick={() => setView("home")} />
          {activeRoom ? (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{activeRoom.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Mã mời:{" "}
                    <span className="font-mono font-semibold tracking-widest text-slate-800">
                      {activeRoom.inviteCode}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Sao chép link
                </button>
              </div>

              <div className="space-y-3">
                {[...activeRoom.members]
                  .sort((a, b) => b.score - a.score)
                  .map((member, index) => {
                    const isOwn = playerUsername === member.username;
                    return (
                      <ScoreBar
                        key={member.username}
                        name={member.displayName}
                        score={member.score}
                        maxScore={maxScore}
                        colorClass={BAR_COLORS[index % BAR_COLORS.length]}
                        isOwn={isOwn}
                        onScoreChange={isOwn ? updateOwnRoomScore : undefined}
                      />
                    );
                  })}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Đang tải phòng…</p>
          )}
        </div>
      )}
    </div>
  );
}
