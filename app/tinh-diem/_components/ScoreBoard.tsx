"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/app/_components/Modal";
import { ROW_COLORS, defaultRowColorForIndex } from "@/_lib/scores/colors";

export interface ScoreRoomMember {
  username: string;
  displayName: string;
  score: number;
  roundScore: number;
  rowColor?: string;
}

export interface ScoreHistoryEntry {
  id: string;
  memberUsername: string;
  memberDisplayName: string;
  previousScore: number;
  newScore: number;
  delta: number;
  changedByUsername: string;
  changedByDisplayName: string;
  createdAt: number;
}

export interface ScoreRoom {
  id: string;
  name: string;
  inviteCode: string;
  hostUsername: string;
  hostDisplayName: string;
  memberUsernames: string[];
  members: ScoreRoomMember[];
  roundNumber: number;
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
const SCORE_STEP_KEY = "tinh-diem-score-step";
const DEFAULT_SCORE_STEP = 5;
const SCORE_PRESETS = [1, 5, 10, 20, 50];

function memberRowColor(member: ScoreRoomMember, index: number) {
  return member.rowColor ?? defaultRowColorForIndex(index);
}

function formatScoreDisplay(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function scoreTone(value: number) {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-slate-800";
}

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

function formatHistoryTime(timestamp: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 00-1.5 0v3.5c0 .199.079.39.22.53l2.25 2.25a.75.75 0 101.06-1.06l-2.03-2.03V6.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ScoreControls({
  score,
  onScoreChange,
}: {
  score: number;
  onScoreChange: (score: number) => void;
}) {
  const [deltaPopupMode, setDeltaPopupMode] = useState<"add" | "subtract" | null>(
    null
  );
  const [deltaAmount, setDeltaAmount] = useState(String(DEFAULT_SCORE_STEP));
  const plusClickRef = useRef(0);
  const minusClickRef = useRef(0);

  useEffect(() => {
    const saved = Number(localStorage.getItem(SCORE_STEP_KEY));
    if (Number.isFinite(saved) && saved > 0) {
      setDeltaAmount(String(Math.round(saved)));
    }
  }, []);

  const applyDelta = (delta: number) => {
    onScoreChange(score + delta);
  };

  const handlePlusClick = () => {
    plusClickRef.current += 1;
    setTimeout(() => {
      if (plusClickRef.current === 1) applyDelta(1);
      plusClickRef.current = 0;
    }, 220);
  };

  const handlePlusDoubleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    plusClickRef.current = 0;
    setDeltaPopupMode("add");
  };

  const handleMinusClick = () => {
    minusClickRef.current += 1;
    setTimeout(() => {
      if (minusClickRef.current === 1) applyDelta(-1);
      minusClickRef.current = 0;
    }, 220);
  };

  const handleMinusDoubleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    minusClickRef.current = 0;
    setDeltaPopupMode("subtract");
  };

  const confirmDeltaAmount = () => {
    const amount = Math.max(1, Math.round(Number(deltaAmount) || DEFAULT_SCORE_STEP));
    localStorage.setItem(SCORE_STEP_KEY, String(amount));
    setDeltaAmount(String(amount));
    applyDelta(deltaPopupMode === "subtract" ? -amount : amount);
    setDeltaPopupMode(null);
  };

  const isSubtract = deltaPopupMode === "subtract";

  return (
    <>
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          type="button"
          onClick={handleMinusClick}
          onDoubleClick={handleMinusDoubleClick}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-600 shadow-sm"
          title="Nhấn 1 lần: −1 · Nhấn đúp: chọn số điểm"
        >
          −
        </button>
        <span className="min-w-[3rem] text-center text-2xl font-bold tabular-nums text-slate-900">
          {score}
        </span>
        <button
          type="button"
          onClick={handlePlusClick}
          onDoubleClick={handlePlusDoubleClick}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-600 shadow-sm"
          title="Nhấn 1 lần: +1 · Nhấn đúp: chọn số điểm"
        >
          +
        </button>
      </div>

      <Modal
        isOpen={deltaPopupMode !== null}
        onRequestClose={() => setDeltaPopupMode(null)}
      >
        <h3 className="pr-6 text-lg font-semibold text-slate-900">
          {isSubtract ? "Trừ điểm" : "Cộng điểm"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Chọn hoặc nhập số điểm muốn {isSubtract ? "trừ" : "cộng"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SCORE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDeltaAmount(String(preset))}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                deltaAmount === String(preset)
                  ? isSubtract
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isSubtract ? "−" : "+"}
              {preset}
            </button>
          ))}
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={deltaAmount}
          onChange={(e) => setDeltaAmount(e.target.value.replace(/[^\d]/g, ""))}
          className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-lg text-slate-900"
        />
        <button
          type="button"
          onClick={confirmDeltaAmount}
          className={`mt-4 w-full rounded-lg py-2.5 text-sm font-medium text-white ${
            isSubtract ? "bg-rose-600 hover:bg-rose-700" : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          OK
        </button>
      </Modal>
    </>
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
  const [historyMember, setHistoryMember] = useState<{
    username: string;
    displayName: string;
  } | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ScoreHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedMemberUsername, setSelectedMemberUsername] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [colorPickerUsername, setColorPickerUsername] = useState<string | null>(null);
  const [pendingRowColor, setPendingRowColor] = useState(defaultRowColorForIndex(0));

  const playerUsername = session?.username ?? guestId;
  const hasName = Boolean(session || guestName.trim());

  const playerBody = useCallback(() => {
    if (session) return {};
    return { guestId, displayName: guestName };
  }, [session, guestId, guestName]);

  const selectedMember = useMemo(() => {
    if (!activeRoom || !selectedMemberUsername) return null;
    return activeRoom.members.find((m) => m.username === selectedMemberUsername) ?? null;
  }, [activeRoom, selectedMemberUsername]);

  useEffect(() => {
    if (!activeRoom) return;
    const isHost = activeRoom.hostUsername === playerUsername;
    const current = activeRoom.members.find((m) => m.username === selectedMemberUsername);
    const canEditCurrent =
      current &&
      (selectedMemberUsername === playerUsername || isHost);
    if (!canEditCurrent) {
      const fallback =
        activeRoom.members.find((m) => m.username === playerUsername) ??
        (isHost ? activeRoom.members[0] : null);
      if (fallback) setSelectedMemberUsername(fallback.username);
    }
  }, [activeRoom, playerUsername, selectedMemberUsername]);

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

  const updateMemberScore = async (score: number, targetUsername = playerUsername) => {
    if (!playerUsername || !activeRoomId || !targetUsername) return;
    const res = await fetch(`/api/scores/rooms/${activeRoomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, targetUsername, ...playerBody() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không cập nhật được điểm.");
      return;
    }
    if (data.room) setActiveRoom(data.room);
  };

  const updateMemberRowColor = async (rowColor: string, targetUsername: string) => {
    if (!playerUsername || !activeRoomId || !targetUsername) return;
    const res = await fetch(`/api/scores/rooms/${activeRoomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowColor, targetUsername, ...playerBody() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không đổi màu được.");
      return;
    }
    if (data.room) setActiveRoom(data.room);
    setColorPickerUsername(null);
  };

  const openRowColorPicker = (member: ScoreRoomMember, index: number) => {
    setColorPickerUsername(member.username);
    setPendingRowColor(memberRowColor(member, index));
  };

  const colorPickerMember = useMemo(() => {
    if (!colorPickerUsername || !activeRoom) return null;
    return activeRoom.members.find((m) => m.username === colorPickerUsername) ?? null;
  }, [activeRoom, colorPickerUsername]);

  const copyInviteLink = async () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}/tinh-diem?room=${activeRoom.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError("Không sao chép được link.");
    }
  };

  const openMemberHistory = async (username?: string, displayName?: string) => {
    if (!activeRoomId) return;
    setHistoryMember(
      username && displayName
        ? { username, displayName }
        : { username: "", displayName: "Tất cả" }
    );
    setHistoryLoading(true);
    setHistoryEntries([]);

    const params = new URLSearchParams();
    if (username) params.set("memberUsername", username);
    if (!session && guestId) params.set("guestId", guestId);

    try {
      const qs = params.toString();
      const res = await fetch(
        `/api/scores/rooms/${activeRoomId}/history${qs ? `?${qs}` : ""}`
      );
      const data = await res.json();
      if (res.ok) {
        setHistoryEntries(data.history ?? []);
      } else {
        setError(data.error || "Không tải được lịch sử.");
      }
    } catch {
      setError("Không tải được lịch sử.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const addPlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeRoomId) return;
    const name = newPlayerName.trim();
    if (!name) {
      setError("Nhập tên người chơi.");
      return;
    }
    setAddingPlayer(true);
    setError("");
    try {
      const res = await fetch(`/api/scores/rooms/${activeRoomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addPlayerName: name, ...playerBody() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thêm được người chơi.");
        return;
      }
      if (data.room) {
        setActiveRoom(data.room as ScoreRoom);
        if (!session) saveLocalRoom(data.room as ScoreRoom);
      }
      setNewPlayerName("");
      setAddPlayerOpen(false);
    } catch {
      setError("Lỗi mạng khi thêm người chơi.");
    } finally {
      setAddingPlayer(false);
    }
  };

  const resetScores = async () => {
    if (!activeRoomId || activeRoom?.hostUsername !== playerUsername) return;
    const res = await fetch(`/api/scores/rooms/${activeRoomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetAll: true, ...playerBody() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không làm mới được.");
      return;
    }
    if (data.room) setActiveRoom(data.room);
  };

  if (!ready) {
    return <p className="text-center text-sm text-slate-500">Đang tải…</p>;
  }

  return (
    <div className="space-y-4">
      {error && view !== "room" && (
        <p className="mx-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {view === "home" && (
        <div className="space-y-4 px-4 py-6">
          <h1 className="text-center text-2xl font-semibold text-slate-900">Tính điểm</h1>
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
        <div className="px-4 py-6">
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
        <div className="px-4 py-6">
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
        <div className="flex min-h-dvh flex-col bg-white">
          {activeRoom ? (
            <>
              <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setView("home")}
                  className="flex h-9 w-9 items-center justify-center text-slate-600"
                  aria-label="Quay lại"
                >
                  ←
                </button>
                <h1 className="text-lg font-semibold text-slate-900">Tính điểm Sâm</h1>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="flex h-9 w-9 items-center justify-center text-slate-600"
                  aria-label="Cài đặt"
                >
                  ⚙
                </button>
              </header>

              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-medium text-slate-700">
                  Ván: {activeRoom.roundNumber ?? 1}
                </p>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="text-sm font-medium text-sky-600 hover:text-sky-800"
                  title="Nhấn để sao chép link mời"
                >
                  {linkCopied ? "Đã sao chép link ✓" : `Mã ${activeRoom.inviteCode}`}
                </button>
              </div>

              <div className="px-4">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_5rem] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Người chơi</span>
                    <span className="text-right">Điểm</span>
                  </div>

                  {activeRoom.members.map((member, index) => {
                    const isOwn = playerUsername === member.username;
                    const isHost = activeRoom.hostUsername === playerUsername;
                    const canEdit = isOwn || isHost;
                    const isSelected = selectedMemberUsername === member.username;
                    const rowColor = memberRowColor(member, index);

                    return (
                      <div
                        key={member.username}
                        role={canEdit ? "button" : undefined}
                        tabIndex={canEdit ? 0 : undefined}
                        onClick={() => canEdit && setSelectedMemberUsername(member.username)}
                        onDoubleClick={(e) => {
                          if (!canEdit) return;
                          e.preventDefault();
                          openRowColorPicker(member, index);
                        }}
                        onKeyDown={(e) => {
                          if (canEdit && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            setSelectedMemberUsername(member.username);
                          }
                        }}
                        style={{ backgroundColor: rowColor }}
                        className={`grid grid-cols-[1fr_5rem] gap-2 border-b border-slate-200/60 px-3 py-3 last:border-b-0 ${
                          isSelected ? "ring-2 ring-inset ring-sky-400/80" : ""
                        } ${canEdit ? "cursor-pointer" : ""}`}
                      >
                        <span className="flex min-w-0 items-center gap-2 font-medium text-slate-900">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMemberHistory(member.username, member.displayName);
                            }}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/60 hover:text-slate-600"
                            title="Lịch sử"
                          >
                            <HistoryIcon />
                          </button>
                          <span className="truncate">
                            {member.displayName}
                            {isOwn && (
                              <span className="ml-1 text-xs font-normal text-sky-600">
                                (bạn)
                              </span>
                            )}
                          </span>
                        </span>
                        <span
                          className={`text-right text-base font-bold tabular-nums ${scoreTone(member.score)}`}
                        >
                          {formatScoreDisplay(member.score)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 px-4">
                <h2 className="mb-2 text-sm font-semibold text-slate-800">Chi tiết ván</h2>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p>{activeRoom.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Chọn người chơi để cộng/trừ điểm · Nhấn đúp hàng để đổi màu · Nhấn đúp +/− để nhập số lớn
                  </p>
                </div>
              </div>

              <div className="flex-1" />

              <div className="border-t border-slate-100 bg-white px-4 py-3">
                {selectedMember &&
                (selectedMember.username === playerUsername ||
                  activeRoom.hostUsername === playerUsername) ? (
                  <div className="mb-3 text-center text-sm text-slate-600">
                    Đang sửa:{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedMember.displayName}
                    </span>
                  </div>
                ) : null}

                {selectedMember &&
                (selectedMember.username === playerUsername ||
                  activeRoom.hostUsername === playerUsername) ? (
                  <ScoreControls
                    score={selectedMember.score}
                    onScoreChange={(score) =>
                      updateMemberScore(score, selectedMember.username)
                    }
                  />
                ) : null}

                {activeRoom.hostUsername === playerUsername && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewPlayerName("");
                      setError("");
                      setAddPlayerOpen(true);
                    }}
                    className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    ＋ Thêm người chơi
                  </button>
                )}

                {activeRoom.hostUsername === playerUsername && (
                  <button
                    type="button"
                    onClick={resetScores}
                    className="mt-3 w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Làm mới
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openMemberHistory()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                >
                  <HistoryIcon />
                  Lịch sử
                </button>
              </div>
            </>
          ) : (
            <p className="p-6 text-sm text-slate-500">Đang tải phòng…</p>
          )}
        </div>
      )}

      <Modal isOpen={settingsOpen} onRequestClose={() => setSettingsOpen(false)}>
        <h3 className="pr-6 text-lg font-semibold text-slate-900">Cài đặt phòng</h3>
        {activeRoom && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>
              <span className="text-slate-500">Tên phòng:</span> {activeRoom.name}
            </p>
            <p>
              <span className="text-slate-500">Mã mời:</span>{" "}
              <span className="font-mono font-semibold">{activeRoom.inviteCode}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                copyInviteLink();
                setSettingsOpen(false);
              }}
              className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white hover:bg-sky-700"
            >
              Sao chép link mời
            </button>
          </div>
        )}
      </Modal>

      <Modal isOpen={addPlayerOpen} onRequestClose={() => setAddPlayerOpen(false)}>
        <h3 className="pr-6 text-lg font-semibold text-slate-900">
          Thêm người chơi
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Chủ phòng có thể thêm người chơi trực tiếp — không cần tài khoản hay mã mời.
        </p>
        <form onSubmit={addPlayer} className="mt-4 space-y-3">
          <input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Tên người chơi (VD: Minh)"
            maxLength={30}
            autoFocus
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
          />
          {error && addPlayerOpen && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={addingPlayer || !newPlayerName.trim()}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addingPlayer ? "Đang thêm…" : "Thêm người chơi"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={historyMember !== null}
        onRequestClose={() => setHistoryMember(null)}
      >
        <h3 className="pr-6 text-lg font-semibold text-slate-900">
          Lịch sử điểm{historyMember?.displayName ? ` — ${historyMember.displayName}` : ""}
        </h3>

        {historyLoading ? (
          <p className="mt-4 text-sm text-slate-500">Đang tải…</p>
        ) : historyEntries.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Chưa có thay đổi nào.</p>
        ) : (
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {historyEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {formatHistoryTime(entry.createdAt)}
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      entry.delta > 0
                        ? "text-emerald-600"
                        : entry.delta < 0
                          ? "text-rose-600"
                          : "text-slate-600"
                    }`}
                  >
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                </div>
                <p className="mt-1 text-slate-800">
                  {entry.memberDisplayName}: {entry.previousScore} → {entry.newScore}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  bởi {entry.changedByDisplayName}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        isOpen={colorPickerMember !== null}
        onRequestClose={() => setColorPickerUsername(null)}
      >
        <h3 className="pr-6 text-lg font-semibold text-slate-900">
          Màu hàng — {colorPickerMember?.displayName}
        </h3>
        <p className="mt-1 text-sm text-slate-500">Chọn màu nền cho người chơi này</p>

        <div className="mt-4 grid grid-cols-6 gap-2">
          {ROW_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setPendingRowColor(color)}
              className={`aspect-square rounded-xl border-2 transition-transform hover:scale-105 ${
                pendingRowColor.toLowerCase() === color.toLowerCase()
                  ? "border-slate-700 ring-2 ring-slate-400 ring-offset-1"
                  : "border-white/80 shadow-sm"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="color"
            value={pendingRowColor}
            onChange={(e) => setPendingRowColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1"
          />
          <span className="font-mono text-sm text-slate-600">{pendingRowColor}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (colorPickerMember) {
              updateMemberRowColor(pendingRowColor, colorPickerMember.username);
            }
          }}
          className="mt-4 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
        >
          Lưu màu
        </button>
      </Modal>
    </div>
  );
}
