"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CUSTOM_WEREWOLF_AVATAR_ID,
  DEFAULT_WEREWOLF_AVATAR_ID,
  getDefaultWerewolfAvatarForUsername,
  getWerewolfAvatarDisplay,
  normalizeWerewolfAvatarId,
  normalizeWerewolfAvatarUrl,
  type WerewolfAvatarId,
} from "@/_lib/werewolf/avatars";
import { Be_Vietnam_Pro, Newsreader } from "next/font/google";
import { MIN_PLAYERS, phaseLabel, roleLabel } from "@/_lib/werewolf/game";
import { createDevMockRoom, type DevScreen } from "@/_lib/werewolf/dev-mock";
import type { WerewolfRoomView } from "@/_lib/werewolf/types";
import WerewolfAvatarImage from "./WerewolfAvatarImage";
import WerewolfAvatarPicker from "./WerewolfAvatarPicker";
import WerewolfChat from "./WerewolfChat";
import WerewolfDevPanel from "./WerewolfDevPanel";
import WerewolfPhaseTimer from "./WerewolfPhaseTimer";
import WerewolfPlayerBoard from "./WerewolfPlayerBoard";
import WerewolfSettingsPanel from "./WerewolfSettingsPanel";
import type { WerewolfRoomSettings } from "@/_lib/werewolf/types";

const display = Newsreader({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ms-display",
});

const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ms-sans",
});

const IS_DEV = process.env.NODE_ENV === "development";

interface SessionInfo {
  username: string;
  displayName: string;
}

interface WerewolfGameProps {
  session: SessionInfo | null;
  initialRoomId?: string;
  initialInviteCode?: string;
  initialDevScreen?: DevScreen;
}

type View = "profile" | "home" | "create" | "join" | "room";

const GUEST_ID_KEY = "werewolf-guest-id";
const GUEST_NAME_KEY = "werewolf-guest-name";
const GUEST_AVATAR_KEY = "werewolf-avatar-id";
const GUEST_AVATAR_URL_KEY = "werewolf-avatar-url";
const LOCAL_ROOMS_KEY = "werewolf-local-rooms";

interface RoomSummary {
  id: string;
  name: string;
  inviteCode: string;
  phase: string;
  playerCount: number;
}

function createGuestId() {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  return `guest_${suffix}`;
}

function loadLocalRooms(): RoomSummary[] {
  try {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RoomSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalRoom(room: WerewolfRoomView) {
  const existing = loadLocalRooms();
  const summary: RoomSummary = {
    id: room.id,
    name: room.name,
    inviteCode: room.inviteCode,
    phase: room.phase,
    playerCount: room.players.length,
  };
  const next = [summary, ...existing.filter((item) => item.id !== room.id)].slice(0, 10);
  localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(next));
}

function phaseTone(phase: string) {
  switch (phase) {
    case "night":
      return "night";
    case "day":
      return "day";
    case "voting":
      return "vote";
    case "ended":
      return "ended";
    default:
      return "lobby";
  }
}

export default function WerewolfGame({
  session,
  initialRoomId = "",
  initialInviteCode = "",
  initialDevScreen,
}: WerewolfGameProps) {
  const [view, setView] = useState<View>(
    initialDevScreen
      ? initialDevScreen === "home" ||
        initialDevScreen === "create" ||
        initialDevScreen === "join"
        ? initialDevScreen
        : "room"
      : initialRoomId
        ? "room"
        : "profile"
  );
  const [room, setRoom] = useState<WerewolfRoomView | null>(null);
  const [localRooms, setLocalRooms] = useState<RoomSummary[]>([]);
  const [roomName, setRoomName] = useState("Phòng Ma Sói");
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [guestId, setGuestId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [avatarId, setAvatarId] = useState<WerewolfAvatarId>(DEFAULT_WEREWOLF_AVATAR_ID);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId);
  const [devScreen, setDevScreen] = useState<DevScreen | null>(initialDevScreen ?? null);
  const [copied, setCopied] = useState(false);

  const devMode = IS_DEV && devScreen !== null;

  const playerUsername =
    session?.username ?? (guestId || (devMode ? "dev_me" : ""));
  const playerDisplayName =
    session?.displayName ?? (guestName || (devMode ? "Tester" : ""));
  const playerAvatarId = session
    ? avatarId || getDefaultWerewolfAvatarForUsername(session.username)
    : avatarId || getDefaultWerewolfAvatarForUsername(guestId || "guest");
  const playerAvatarUrl =
    playerAvatarId === CUSTOM_WEREWOLF_AVATAR_ID ? avatarUrl : null;
  const hasName = Boolean(session || guestName.trim() || devMode);

  const playerBody = useCallback(() => {
    const avatar =
      playerAvatarUrl != null
        ? { avatarId: CUSTOM_WEREWOLF_AVATAR_ID, avatarUrl: playerAvatarUrl }
        : { avatarId: playerAvatarId };
    if (session) return avatar;
    return { guestId, displayName: guestName, ...avatar };
  }, [session, guestId, guestName, playerAvatarId, playerAvatarUrl]);

  const guestQuery = useCallback(() => {
    if (session) return "";
    return `?guestId=${encodeURIComponent(guestId)}`;
  }, [session, guestId]);

  useEffect(() => {
    const storedUrl = normalizeWerewolfAvatarUrl(
      localStorage.getItem(GUEST_AVATAR_URL_KEY)
    );
    const storedAvatar = normalizeWerewolfAvatarId(
      localStorage.getItem(GUEST_AVATAR_KEY) ??
        (session
          ? getDefaultWerewolfAvatarForUsername(session.username)
          : DEFAULT_WEREWOLF_AVATAR_ID)
    );
    if (storedUrl) {
      setAvatarId(CUSTOM_WEREWOLF_AVATAR_ID);
      setAvatarUrl(storedUrl);
    } else {
      setAvatarId(
        storedAvatar === CUSTOM_WEREWOLF_AVATAR_ID
          ? DEFAULT_WEREWOLF_AVATAR_ID
          : storedAvatar
      );
      setAvatarUrl(null);
    }
    setLocalRooms(loadLocalRooms());

    if (session) {
      if (!initialRoomId && !initialInviteCode && !initialDevScreen) {
        setView("home");
      }
      setReady(true);
      return;
    }

    let id = localStorage.getItem(GUEST_ID_KEY) ?? "";
    if (!id.startsWith("guest_")) {
      id = createGuestId();
      localStorage.setItem(GUEST_ID_KEY, id);
    }

    const savedName =
      localStorage.getItem(GUEST_NAME_KEY) ?? (IS_DEV ? "Tester" : "");
    setGuestId(id);
    setGuestName(savedName);
    setNameInput(savedName);
    if (!localStorage.getItem(GUEST_AVATAR_KEY) && !storedUrl) {
      const defaultAvatar = getDefaultWerewolfAvatarForUsername(id);
      localStorage.setItem(GUEST_AVATAR_KEY, defaultAvatar);
      setAvatarId(defaultAvatar);
    }
    if (IS_DEV && savedName) {
      localStorage.setItem(GUEST_NAME_KEY, savedName);
    }
    if (
      savedName.trim() &&
      !initialRoomId &&
      !initialInviteCode &&
      !initialDevScreen
    ) {
      setView("home");
    }
    setReady(true);
  }, [session, initialRoomId, initialInviteCode, initialDevScreen]);

  const jumpToDevScreen = useCallback(
    (screen: DevScreen) => {
      setDevScreen(screen);
      setError("");
      setSelectedTarget("");

      if (screen === "home" || screen === "create" || screen === "join") {
        setRoom(null);
        setActiveRoomId("");
        setView(screen);
        return;
      }

      const mock = createDevMockRoom(
        screen,
        playerUsername || "dev_me",
        playerDisplayName || "Tester",
        playerAvatarId,
        playerAvatarUrl
      );
      setRoom(mock);
      setActiveRoomId("dev-mock-room");
      setView("room");
    },
    [playerUsername, playerDisplayName, playerAvatarId, playerAvatarUrl]
  );

  const exitDevMode = useCallback(() => {
    setDevScreen(null);
    setRoom(null);
    setActiveRoomId("");
    setView("home");
    setError("");
  }, []);

  useEffect(() => {
    if (!IS_DEV || !initialDevScreen || !ready) return;
    jumpToDevScreen(initialDevScreen);
  }, [ready, initialDevScreen, jumpToDevScreen]);

  const refreshRoom = useCallback(
    async (roomId: string) => {
      const response = await fetch(`/api/werewolf/rooms/${roomId}${guestQuery()}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.room as WerewolfRoomView;
    },
    [guestQuery]
  );

  useEffect(() => {
    if (devMode || !ready || !initialRoomId || !hasName) return;

    refreshRoom(initialRoomId).then((initial) => {
      if (initial) {
        setRoom(initial);
        setActiveRoomId(initialRoomId);
        saveLocalRoom(initial);
        setLocalRooms(loadLocalRooms());
        setView("room");
      }
    });
  }, [ready, initialRoomId, hasName, refreshRoom, devMode]);

  useEffect(() => {
    if (devMode || !ready || !initialInviteCode || initialRoomId || !hasName) return;

    const joinByInvite = async () => {
      setLoading(true);
      const response = await fetch("/api/werewolf/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: initialInviteCode, ...playerBody() }),
      });
      const data = await response.json();
      if (response.ok && data.room) {
        const viewRoom = await refreshRoom(data.room.id);
        if (viewRoom) {
          setRoom(viewRoom);
          setActiveRoomId(data.room.id);
          saveLocalRoom(viewRoom);
          setLocalRooms(loadLocalRooms());
          setView("room");
        }
      } else {
        setError(data.error ?? "Không tham gia được phòng.");
      }
      setLoading(false);
    };

    joinByInvite();
  }, [ready, initialInviteCode, initialRoomId, hasName, playerBody, refreshRoom, devMode]);

  useEffect(() => {
    if (devMode || !activeRoomId || view !== "room" || !playerUsername) return;

    let cancelled = false;

    refreshRoom(activeRoomId).then((initial) => {
      if (!cancelled && initial) {
        setRoom(initial);
        saveLocalRoom(initial);
        setLocalRooms(loadLocalRooms());
      }
    });

    const source = new EventSource(
      `/api/werewolf/rooms/${activeRoomId}/stream${guestQuery()}`
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { room?: WerewolfRoomView };
        if (payload.room) {
          setRoom(payload.room);
          saveLocalRoom(payload.room);
          setLocalRooms(loadLocalRooms());
        }
      } catch {
        // ignore malformed events
      }
    };

    return () => {
      cancelled = true;
      source.close();
    };
  }, [activeRoomId, refreshRoom, view, playerUsername, guestQuery, devMode]);

  const alivePlayers = useMemo(
    () => room?.players.filter((player) => player.status === "alive") ?? [],
    [room]
  );

  const myStatus = room?.players.find(
    (player) => player.username === playerUsername
  )?.status;

  const performAction = async (
    action: string,
    targetUsername = "",
    extra: Record<string, unknown> = {}
  ) => {
    if (!activeRoomId) return;

    if (devMode) {
      setError(`[DEV] "${action}" — mock only, không gọi API.`);
      setSelectedTarget("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/werewolf/rooms/${activeRoomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          targetUsername,
          ...extra,
          ...playerBody(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Có lỗi xảy ra.");
        return;
      }
      if (data.room) {
        setRoom(data.room);
        saveLocalRoom(data.room);
        setSelectedTarget("");
      }
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const saveRoomSettings = useCallback(
    async (settings: WerewolfRoomSettings) => {
      if (!activeRoomId || !room || room.hostUsername !== playerUsername) return;
      setRoom({ ...room, settings });

      if (devMode) return;

      try {
        const response = await fetch(`/api/werewolf/rooms/${activeRoomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_settings",
            settings,
            ...playerBody(),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Không lưu được cài đặt.");
          return;
        }
        if (data.room) {
          setRoom(data.room);
          saveLocalRoom(data.room);
        }
      } catch {
        setError("Không thể kết nối máy chủ.");
      }
    },
    [activeRoomId, room, playerUsername, playerBody, devMode]
  );

  const createRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!hasName) {
      setError("Nhập tên của bạn trước.");
      setView("profile");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/werewolf/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, ...playerBody() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Không tạo được phòng.");
        return;
      }
      const viewRoom = await refreshRoom(data.room.id);
      if (viewRoom) {
        setRoom(viewRoom);
        setActiveRoomId(data.room.id);
        saveLocalRoom(viewRoom);
        setLocalRooms(loadLocalRooms());
        setView("room");
      }
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!hasName) {
      setError("Nhập tên của bạn trước.");
      setView("profile");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/werewolf/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode, ...playerBody() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Không tham gia được phòng.");
        return;
      }
      const viewRoom = await refreshRoom(data.room.id);
      if (viewRoom) {
        setRoom(viewRoom);
        setActiveRoomId(data.room.id);
        saveLocalRoom(viewRoom);
        setLocalRooms(loadLocalRooms());
        setView("room");
      }
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const openRoom = async (roomId: string) => {
    if (!hasName) {
      setError("Nhập tên của bạn trước.");
      setView("profile");
      return;
    }
    setLoading(true);
    setError("");
    const viewRoom = await refreshRoom(roomId);
    if (viewRoom) {
      setRoom(viewRoom);
      setActiveRoomId(roomId);
      setView("room");
    } else {
      setError("Không mở được phòng.");
    }
    setLoading(false);
  };

  const persistAvatarChoice = (
    nextAvatarId: WerewolfAvatarId,
    nextAvatarUrl: string | null
  ) => {
    localStorage.setItem(GUEST_AVATAR_KEY, nextAvatarId);
    if (nextAvatarUrl) {
      localStorage.setItem(GUEST_AVATAR_URL_KEY, nextAvatarUrl);
    } else {
      localStorage.removeItem(GUEST_AVATAR_URL_KEY);
    }
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    if (session) {
      persistAvatarChoice(playerAvatarId, playerAvatarUrl);
      setView("home");
      setError("");
      return;
    }

    const name = nameInput.trim();
    if (!name) {
      setError("Vui lòng nhập tên.");
      return;
    }
    localStorage.setItem(GUEST_NAME_KEY, name);
    persistAvatarChoice(playerAvatarId, playerAvatarUrl);
    setGuestName(name);
    setView("home");
    setError("");
  };

  const saveAvatar = (nextAvatarId: WerewolfAvatarId, nextAvatarUrl?: string | null) => {
    const url =
      nextAvatarId === CUSTOM_WEREWOLF_AVATAR_ID
        ? normalizeWerewolfAvatarUrl(nextAvatarUrl)
        : null;
    setAvatarId(nextAvatarId);
    setAvatarUrl(url);
    persistAvatarChoice(nextAvatarId, url);
  };

  const ensureName = (nextView: View) => {
    if (!hasName) {
      setError("Nhập tên và chọn avatar trước.");
      setView("profile");
      return;
    }
    setView(nextView);
    setError("");
  };

  const selectedAvatar = getWerewolfAvatarDisplay(playerAvatarId, playerAvatarUrl);

  const copyInvite = async () => {
    if (!room?.inviteCode) return;
    const url = `${window.location.origin}/werewolf?room=${room.inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const canNightAction =
    room?.phase === "night" &&
    myStatus === "alive" &&
    room.myRole &&
    ["werewolf", "seer", "doctor"].includes(room.myRole) &&
    !room.nightActions[playerUsername];

  const canCastVote =
    room?.phase === "voting" &&
    myStatus === "alive" &&
    !room.votes[playerUsername];

  const nightActionLabel =
    room?.myRole === "werewolf"
      ? "Chọn nạn nhân"
      : room?.myRole === "seer"
        ? "Điều tra"
        : room?.myRole === "doctor"
          ? "Bảo vệ"
          : "Hành động ban đêm";

  const selectableTargets = useMemo(() => {
    if (!room || (!canNightAction && !canCastVote)) return [];

    if (canNightAction) {
      return alivePlayers
        .filter((player) => {
          if (room.myRole === "werewolf") {
            return (
              player.username !== playerUsername &&
              room.knownRoles[player.username] !== "werewolf"
            );
          }
          return true;
        })
        .map((player) => player.username);
    }

    return alivePlayers
      .filter((player) => player.username !== playerUsername)
      .map((player) => player.username);
  }, [room, canNightAction, canCastVote, alivePlayers, playerUsername]);

  const hasBottomAction =
    Boolean(room) &&
    (Boolean(room?.phase === "lobby" && room.canStart) ||
      canNightAction ||
      Boolean(room?.phase === "day" && room.hostUsername === playerUsername) ||
      canCastVote ||
      Boolean(room?.phase === "ended" && room.hostUsername === playerUsername));

  if (!ready) {
    return (
      <div className={`${display.variable} ${sans.variable} ms-root ms-loading`}>
        <p>Đang tải…</p>
        <WerewolfStyles />
      </div>
    );
  }

  return (
    <div
      className={`${display.variable} ${sans.variable} ms-root ${
        view === "room" && room ? `ms-tone-${phaseTone(room.phase)}` : "ms-tone-lobby"
      }`}
    >
      <div className="ms-atmosphere" aria-hidden />
      <div className="ms-mist" aria-hidden />

      {view === "profile" && (
        <section className="ms-hero">
          <Link href="/" className="ms-back">
            ← Eggs
          </Link>

          <div className="ms-hero-copy ms-hero-copy-compact">
            <h1 className="ms-brand">Ma Sói</h1>
            <p className="ms-lead">Chọn tên và avatar trước khi vào phòng.</p>
          </div>

          <form onSubmit={saveProfile} className="ms-hero-actions ms-name-form">
            {session ? (
              <p className="ms-hello">
                Xin chào, <strong>{session.displayName}</strong>
              </p>
            ) : (
              <>
                <label htmlFor="ms-name">Tên của bạn</label>
                <div className="ms-name-row">
                  <input
                    id="ms-name"
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    placeholder="VD: Minh"
                    maxLength={30}
                    autoComplete="nickname"
                  />
                </div>
              </>
            )}

            <WerewolfAvatarPicker
              value={playerAvatarId}
              avatarUrl={playerAvatarUrl}
              onChange={saveAvatar}
              label="Chọn avatar"
            />

            <button
              type="submit"
              className="ms-btn ms-btn-primary ms-btn-block"
              disabled={!session && !nameInput.trim()}
            >
              Tiếp tục
            </button>

            {!session ? (
              <p className="ms-login-hint">
                <Link href="/login?next=/werewolf">Đăng nhập</Link> nếu muốn lưu tài khoản
              </p>
            ) : null}
          </form>
        </section>
      )}

      {view === "home" && (
        <section className="ms-hero">
          <button
            type="button"
            className="ms-back"
            onClick={() => setView("profile")}
          >
            ← Đổi tên / avatar
          </button>

          <div className="ms-hero-copy">
            <h1 className="ms-brand">Ma Sói</h1>
            <p className="ms-lead">
              Tạo phòng, gửi mã mời, chơi trực tuyến với bạn bè.
            </p>
          </div>

          <div className="ms-hero-actions">
            <button
              type="button"
              className="ms-profile-chip"
              onClick={() => setView("profile")}
            >
              <span className="ms-profile-chip-avatar">
                <WerewolfAvatarImage
                  src={selectedAvatar.image}
                  alt={selectedAvatar.label}
                  size={80}
                  className="ms-profile-chip-img"
                />
              </span>
              <span className="ms-profile-chip-text">
                <span className="ms-profile-chip-name">{playerDisplayName}</span>
                <span className="ms-profile-chip-meta">{selectedAvatar.label}</span>
              </span>
            </button>

            <div className="ms-cta-row">
              <button
                type="button"
                className="ms-btn ms-btn-primary"
                onClick={() => ensureName("create")}
              >
                Tạo phòng
              </button>
              <button
                type="button"
                className="ms-btn ms-btn-ghost"
                onClick={() => ensureName("join")}
              >
                Tham gia
              </button>
            </div>
          </div>

          {localRooms.length > 0 ? (
            <div className="ms-recent">
              <h2>Phòng gần đây</h2>
              <ul>
                {localRooms.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => openRoom(item.id)}>
                      <span className="ms-recent-main">
                        <span className="ms-recent-name">{item.name}</span>
                        <span className="ms-recent-meta">
                          {item.inviteCode} · {item.playerCount} người
                        </span>
                      </span>
                      <span className={`ms-phase-chip ms-phase-${phaseTone(item.phase)}`}>
                        {phaseLabel(item.phase as WerewolfRoomView["phase"])}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="ms-rules">
              Cần ít nhất {MIN_PLAYERS} người · Ma Sói, Dân Làng, Tiên Tri, Bác Sĩ
            </p>
          )}
        </section>
      )}

      {view === "create" && (
        <section className="ms-sheet">
          <button type="button" className="ms-back" onClick={() => setView("home")}>
            ← Quay lại
          </button>
          <h1 className="ms-sheet-title">Tạo phòng</h1>
          <p className="ms-sheet-sub">Đặt tên rồi gửi mã mời cho bạn bè.</p>
          <form onSubmit={createRoom} className="ms-form">
            <label htmlFor="ms-room-name">
              Tên phòng
              <input
                id="ms-room-name"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                maxLength={40}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="ms-btn ms-btn-primary ms-btn-block"
            >
              {loading ? "Đang tạo…" : "Tạo phòng"}
            </button>
          </form>
        </section>
      )}

      {view === "join" && (
        <section className="ms-sheet">
          <button type="button" className="ms-back" onClick={() => setView("home")}>
            ← Quay lại
          </button>
          <h1 className="ms-sheet-title">Tham gia</h1>
          <p className="ms-sheet-sub">Nhập mã phòng bạn nhận được.</p>
          <form onSubmit={joinRoom} className="ms-form">
            <label htmlFor="ms-invite">
              Mã phòng
              <input
                id="ms-invite"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                className="ms-invite-input"
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="ms-btn ms-btn-primary ms-btn-block"
            >
              {loading ? "Đang vào…" : "Vào phòng"}
            </button>
          </form>
        </section>
      )}

      {view === "room" && room && (
        <div className={`ms-room ${hasBottomAction ? "ms-room-docked" : ""}`}>
          {devMode ? (
            <p className="ms-dev-banner">DEV mock · {devScreen}</p>
          ) : null}

          <header className="ms-room-top">
            <button type="button" className="ms-back" onClick={() => setView("home")}>
              ← Thoát
            </button>
            <div className="ms-room-heading">
              <h1>{room.name}</h1>
              <span className={`ms-phase-chip ms-phase-${phaseTone(room.phase)}`}>
                {phaseLabel(room.phase)}
                {room.dayNumber > 0 ? ` · ${room.dayNumber}` : ""}
              </span>
            </div>
            <div className="ms-invite-bar">
              <code>{room.inviteCode}</code>
              <button type="button" onClick={copyInvite}>
                {copied ? "Đã chép" : "Chép link"}
              </button>
            </div>
          </header>

          <p className="ms-event" role="status">
            {room.lastEvent || "Đang chờ…"}
          </p>

          <WerewolfPhaseTimer
            phaseEndsAt={room.phaseEndsAt}
            onTimeout={() => {
              void performAction("timeout");
            }}
          />

          {room.winner ? (
            <p className="ms-winner">
              {room.winner === "werewolves" ? "Ma Sói thắng!" : "Dân Làng thắng!"}
            </p>
          ) : null}

          {room.myRole && room.phase !== "lobby" ? (
            <div className="ms-role">
              <span className="ms-role-label">Vai của bạn</span>
              <strong className={`ms-role-value ms-role-${room.myRole}`}>
                {roleLabel(room.myRole)}
              </strong>
              {myStatus === "dead" ? (
                <span className="ms-dead-note">Bạn đã chết — xem được mọi vai.</span>
              ) : null}
              {room.phase === "ended" && room.settings.revealRolesAtEnd ? (
                <span className="ms-dead-note">Vai trò đã được lộ.</span>
              ) : null}
            </div>
          ) : null}

          {room.phase === "lobby" ? (
            <WerewolfSettingsPanel
              settings={room.settings}
              editable={room.hostUsername === playerUsername}
              playerCount={room.players.length}
              onChange={saveRoomSettings}
            />
          ) : null}

          <WerewolfPlayerBoard
            players={room.players}
            knownRoles={room.knownRoles}
            seerResults={room.seerResults}
            playerUsername={playerUsername}
            selectedTarget={selectedTarget}
            onSelectTarget={
              canNightAction || canCastVote ? setSelectedTarget : undefined
            }
            selectableUsernames={selectableTargets}
            canRemoveBots={
              room.phase === "lobby" && room.hostUsername === playerUsername
            }
            onRemoveBot={(username) => performAction("remove_bot", username)}
          />

          {hasBottomAction ? (
            <div className="ms-dock">
              {room.phase === "lobby" ? (
                <div className="ms-dock-panel">
                  <p>
                    {MIN_PLAYERS - room.players.length > 0
                      ? `Còn thiếu ${MIN_PLAYERS - room.players.length} người`
                      : "Đủ người — chủ phòng có thể bắt đầu"}
                  </p>
                  {room.hostUsername === playerUsername ? (
                    <button
                      type="button"
                      disabled={loading || room.players.length >= 12}
                      className="ms-btn ms-btn-ghost ms-btn-block"
                      onClick={() => performAction("add_bot")}
                    >
                      Thêm bot
                    </button>
                  ) : null}
                  {room.canStart ? (
                    <button
                      type="button"
                      disabled={loading}
                      className="ms-btn ms-btn-danger ms-btn-block"
                      onClick={() => performAction("start")}
                    >
                      Bắt đầu trò chơi
                    </button>
                  ) : null}
                </div>
              ) : null}

              {canNightAction ? (
                <div className="ms-dock-panel">
                  <h3>{nightActionLabel}</h3>
                  <p className="ms-dock-hint">Chọn người trên bàn chơi</p>
                  <button
                    type="button"
                    disabled={loading || !selectedTarget}
                    className="ms-btn ms-btn-primary ms-btn-block"
                    onClick={() => performAction("night_action", selectedTarget)}
                  >
                    Xác nhận
                  </button>
                  {room.pendingNightActors.length > 0 ? (
                    <p className="ms-dock-wait">
                      Chờ {room.pendingNightActors.length} hành động
                    </p>
                  ) : null}
                </div>
              ) : null}

              {room.phase === "day" && room.hostUsername === playerUsername ? (
                <div className="ms-dock-panel">
                  <button
                    type="button"
                    disabled={loading}
                    className="ms-btn ms-btn-day ms-btn-block"
                    onClick={() => performAction("start_vote")}
                  >
                    Bắt đầu bỏ phiếu
                  </button>
                </div>
              ) : null}

              {canCastVote ? (
                <div className="ms-dock-panel">
                  <h3>Bỏ phiếu loại</h3>
                  <p className="ms-dock-hint">Chọn người trên bàn chơi</p>
                  <button
                    type="button"
                    disabled={loading || !selectedTarget}
                    className="ms-btn ms-btn-danger ms-btn-block"
                    onClick={() => performAction("vote", selectedTarget)}
                  >
                    Bỏ phiếu
                  </button>
                  {room.pendingVoters.length > 0 ? (
                    <p className="ms-dock-wait">
                      Chờ {room.pendingVoters.length} người bỏ phiếu
                    </p>
                  ) : null}
                </div>
              ) : null}

              {room.phase === "ended" && room.hostUsername === playerUsername ? (
                <div className="ms-dock-panel">
                  <button
                    type="button"
                    disabled={loading}
                    className="ms-btn ms-btn-ghost ms-btn-block"
                    onClick={() => performAction("reset")}
                  >
                    Chơi lại
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="ms-you">
            Đang chơi với tên <strong>{playerDisplayName}</strong>
          </p>

          <WerewolfChat
            roomId={activeRoomId}
            phase={room.phase}
            myStatus={myStatus}
            playerUsername={playerUsername}
            playerDisplayName={playerDisplayName}
            players={room.players}
            guestQuery={guestQuery}
            playerBody={playerBody}
            devMode={devMode}
            hasBottomDock={hasBottomAction}
          />
        </div>
      )}

      {error ? (
        <p className="ms-error" role="alert">
          {error}
        </p>
      ) : null}

      {IS_DEV ? (
        <WerewolfDevPanel
          activeScreen={devScreen ?? "live"}
          onJump={jumpToDevScreen}
          onExitDev={exitDevMode}
        />
      ) : null}

      <WerewolfStyles />
    </div>
  );
}

function WerewolfStyles() {
  return (
    <style jsx global>{`
      html:has(.ms-root),
      body:has(.ms-root) {
        height: 100%;
        overflow: hidden;
        overscroll-behavior: none;
      }

      .ms-root {
        --ms-ink: #1a221c;
        --ms-mute: #5a685e;
        --ms-bone: #f3efe6;
        --ms-fog: #d8e0d6;
        --ms-pine: #2f4a3a;
        --ms-moss: #4f7a5c;
        --ms-ember: #b54a32;
        --ms-ember-deep: #8f3522;
        --ms-day: #c9872a;
        --ms-day-deep: #a66c18;
        --ms-night: #243029;
        --font-display: var(--font-ms-display), "Newsreader", Georgia, serif;
        --font-body: var(--font-ms-sans), "Be Vietnam Pro", sans-serif;
        position: relative;
        width: 100%;
        height: 100vh;
        height: 100svh;
        height: 100dvh;
        max-height: 100vh;
        max-height: 100svh;
        max-height: 100dvh;
        color: var(--ms-ink);
        font-family: var(--font-body);
        background: var(--ms-bone);
        overflow: hidden;
        overscroll-behavior: none;
      }

      .ms-atmosphere {
        pointer-events: none;
        position: fixed;
        inset: 0;
        z-index: 0;
        background:
          radial-gradient(90% 60% at 50% -8%, #c5d2c4 0%, transparent 55%),
          radial-gradient(70% 50% at 100% 20%, #b9c8b5 0%, transparent 45%),
          radial-gradient(60% 40% at 0% 80%, #cfd6c8 0%, transparent 50%),
          linear-gradient(180deg, #e8ede4 0%, var(--ms-bone) 48%, #e4e8df 100%);
        transition: background 0.6s ease;
      }

      .ms-mist {
        pointer-events: none;
        position: fixed;
        inset: -20% 0 auto;
        height: 55%;
        z-index: 0;
        background: radial-gradient(
          ellipse at 50% 0%,
          rgba(255, 255, 255, 0.55) 0%,
          transparent 70%
        );
        animation: ms-drift 14s ease-in-out infinite alternate;
      }

      .ms-tone-night .ms-atmosphere {
        background:
          radial-gradient(80% 50% at 50% -5%, #6a7d6e 0%, transparent 50%),
          radial-gradient(50% 40% at 90% 30%, #3d5244 0%, transparent 45%),
          linear-gradient(180deg, #2a3830 0%, #1e2a23 55%, #18211c 100%);
      }

      .ms-tone-night {
        --ms-ink: #e8ebe4;
        --ms-mute: #a8b5ab;
        color: var(--ms-ink);
      }

      .ms-tone-day .ms-atmosphere {
        background:
          radial-gradient(90% 55% at 50% -10%, #f0d9a8 0%, transparent 55%),
          radial-gradient(60% 40% at 0% 70%, #e8d4b0 0%, transparent 45%),
          linear-gradient(180deg, #f6ecd8 0%, #f3efe6 50%, #ebe4d4 100%);
      }

      .ms-tone-vote .ms-atmosphere {
        background:
          radial-gradient(80% 50% at 50% -8%, #e8c4b4 0%, transparent 50%),
          linear-gradient(180deg, #f0ddd4 0%, #f3efe6 55%, #e8dfd6 100%);
      }

      .ms-tone-ended .ms-atmosphere {
        background:
          radial-gradient(70% 45% at 50% 0%, #c5cfc4 0%, transparent 55%),
          linear-gradient(180deg, #dce3d8 0%, #eef1eb 100%);
      }

      .ms-loading {
        display: grid;
        place-items: center;
        height: 100%;
        color: var(--ms-mute);
      }

      .ms-hero,
      .ms-sheet,
      .ms-room {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 28rem;
        height: 100%;
        margin: 0 auto;
        padding: 1rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }

      .ms-hero {
        display: flex;
        flex-direction: column;
        animation: ms-rise 0.7s ease both;
      }

      .ms-back {
        align-self: flex-start;
        margin: 0.25rem 0 0;
        border: 0;
        background: none;
        color: var(--ms-mute);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        padding: 0.35rem 0;
      }

      .ms-back:hover {
        color: var(--ms-ink);
      }

      .ms-hero-copy {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 1.5rem 0 1rem;
        min-height: 38dvh;
      }

      .ms-hero-copy-compact {
        flex: 0;
        min-height: 0;
        padding: 1rem 0 0.5rem;
      }

      .ms-brand {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(3.4rem, 16vw, 4.75rem);
        font-weight: 600;
        line-height: 0.92;
        letter-spacing: -0.03em;
        color: var(--ms-pine);
        animation: ms-brand-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .ms-hero-copy-compact .ms-brand {
        font-size: clamp(2.6rem, 12vw, 3.5rem);
      }

      .ms-lead {
        margin: 1rem 0 0;
        max-width: 18rem;
        font-size: 1.05rem;
        line-height: 1.45;
        color: var(--ms-mute);
        animation: ms-rise 0.8s ease 0.12s both;
      }

      .ms-hero-actions {
        animation: ms-rise 0.75s ease 0.2s both;
      }

      .ms-profile-chip {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        margin-bottom: 1rem;
        padding: 0.65rem 0.75rem;
        border: 1.5px solid rgba(47, 74, 58, 0.16);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.55);
        text-align: left;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }

      .ms-profile-chip:hover {
        background: rgba(255, 255, 255, 0.75);
      }

      .ms-profile-chip-avatar {
        position: relative;
        flex-shrink: 0;
        width: 2.5rem;
        height: 2.5rem;
        overflow: hidden;
        border-radius: 999px;
        box-shadow: 0 0 0 1.5px var(--ms-pine);
        background: rgba(47, 74, 58, 0.08);
      }

      .ms-profile-chip-avatar :global(.ms-profile-chip-img) {
        position: absolute;
        inset: 0;
        display: block;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        object-fit: cover;
      }

      .ms-profile-chip-text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
      }

      .ms-profile-chip-name {
        font-weight: 600;
        font-size: 0.98rem;
        color: var(--ms-ink);
      }

      .ms-profile-chip-meta {
        font-size: 0.75rem;
        color: var(--ms-mute);
      }

      .ms-account-card {
        margin-bottom: 1.1rem;
      }

      .ms-hello {
        margin: 0 0 1rem;
        font-size: 0.95rem;
        color: var(--ms-mute);
      }

      .ms-hello strong {
        color: var(--ms-ink);
        font-weight: 600;
      }

      .ms-name-form {
        margin-bottom: 1.1rem;
      }

      .ms-name-form label,
      .ms-form label {
        display: block;
        margin-bottom: 0.4rem;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--ms-mute);
      }

      .ms-name-row {
        display: flex;
        gap: 0.5rem;
      }

      .ms-name-row input,
      .ms-form input {
        flex: 1;
        width: 100%;
        min-height: 3rem;
        border: 1.5px solid rgba(47, 74, 58, 0.22);
        border-radius: 0.85rem;
        background: rgba(255, 255, 255, 0.72);
        padding: 0 0.95rem;
        color: var(--ms-ink);
        font: inherit;
        font-size: 1rem;
        outline: none;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .ms-name-row input:focus,
      .ms-form input:focus {
        border-color: var(--ms-pine);
        background: #fff;
      }

      .ms-name-row button {
        flex-shrink: 0;
        min-height: 3rem;
        min-width: 3.5rem;
        border: 0;
        border-radius: 0.85rem;
        background: var(--ms-pine);
        color: var(--ms-bone);
        font: inherit;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
      }

      .ms-hint {
        margin: 0.45rem 0 0;
        font-size: 0.78rem;
        color: var(--ms-mute);
      }

      .ms-cta-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
      }

      .ms-btn {
        min-height: 3.15rem;
        border-radius: 0.95rem;
        border: 1.5px solid transparent;
        font: inherit;
        font-size: 0.98rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;
      }

      .ms-btn:active:not(:disabled) {
        transform: scale(0.98);
      }

      .ms-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .ms-btn-primary {
        background: var(--ms-pine);
        color: var(--ms-bone);
      }

      .ms-btn-primary:hover:not(:disabled) {
        background: #243a2e;
      }

      .ms-btn-ghost {
        background: transparent;
        border-color: rgba(47, 74, 58, 0.35);
        color: var(--ms-pine);
      }

      .ms-btn-ghost:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.45);
      }

      .ms-btn-danger {
        background: var(--ms-ember);
        color: #fff8f5;
      }

      .ms-btn-danger:hover:not(:disabled) {
        background: var(--ms-ember-deep);
      }

      .ms-btn-day {
        background: var(--ms-day);
        color: #fffaf0;
      }

      .ms-btn-day:hover:not(:disabled) {
        background: var(--ms-day-deep);
      }

      .ms-btn-block {
        width: 100%;
      }

      .ms-login-hint {
        margin: 0.9rem 0 0;
        text-align: center;
        font-size: 0.78rem;
        color: var(--ms-mute);
      }

      .ms-login-hint a {
        color: var(--ms-pine);
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .ms-rules {
        margin: auto 0 0.5rem;
        padding-top: 1.5rem;
        font-size: 0.78rem;
        line-height: 1.4;
        color: var(--ms-mute);
        text-align: center;
      }

      .ms-recent {
        margin-top: 1.75rem;
        padding-top: 0.25rem;
      }

      .ms-recent h2 {
        margin: 0 0 0.65rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ms-mute);
      }

      .ms-recent ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .ms-recent button {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        min-height: 3.4rem;
        padding: 0.7rem 0.15rem;
        border: 0;
        border-bottom: 1px solid rgba(47, 74, 58, 0.12);
        background: none;
        text-align: left;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }

      .ms-recent-name {
        display: block;
        font-weight: 600;
        font-size: 0.98rem;
      }

      .ms-recent-meta {
        display: block;
        margin-top: 0.15rem;
        font-size: 0.75rem;
        color: var(--ms-mute);
        letter-spacing: 0.04em;
      }

      .ms-phase-chip {
        flex-shrink: 0;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--ms-mute);
      }

      .ms-phase-night {
        color: #3a4f42;
      }

      .ms-tone-night .ms-phase-night {
        color: #c5d4c8;
      }

      .ms-phase-day {
        color: var(--ms-day-deep);
      }

      .ms-phase-vote {
        color: var(--ms-ember-deep);
      }

      .ms-sheet {
        display: flex;
        flex-direction: column;
        animation: ms-rise 0.45s ease both;
      }

      .ms-sheet-title {
        margin: 1.5rem 0 0.35rem;
        font-family: var(--font-display);
        font-size: 2.4rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: var(--ms-pine);
        line-height: 1.05;
      }

      .ms-sheet-sub {
        margin: 0 0 1.75rem;
        color: var(--ms-mute);
        font-size: 0.95rem;
      }

      .ms-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .ms-form label {
        margin-bottom: 0;
      }

      .ms-form input {
        margin-top: 0.45rem;
      }

      .ms-invite-input {
        letter-spacing: 0.28em;
        text-transform: uppercase;
        font-weight: 600;
        font-size: 1.25rem !important;
        text-align: center;
      }

      .ms-room {
        padding-bottom: 2rem;
        animation: ms-rise 0.45s ease both;
      }

      .ms-room-docked {
        padding-bottom: calc(11rem + env(safe-area-inset-bottom));
      }

      .ms-dev-banner {
        margin: 0 0 0.75rem;
        padding: 0.45rem 0.7rem;
        border: 1px dashed #b8860b;
        border-radius: 0.6rem;
        background: rgba(255, 248, 220, 0.85);
        color: #6b4f00;
        font-size: 0.72rem;
        font-weight: 600;
        text-align: center;
      }

      .ms-room-top {
        padding-top: 0.15rem;
      }

      .ms-room-heading {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 0.85rem;
      }

      .ms-room-heading h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 1.85rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.1;
      }

      .ms-invite-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 0.9rem;
        padding: 0.7rem 0;
        border-top: 1px solid rgba(47, 74, 58, 0.14);
        border-bottom: 1px solid rgba(47, 74, 58, 0.14);
      }

      .ms-tone-night .ms-invite-bar {
        border-color: rgba(232, 235, 228, 0.16);
      }

      .ms-invite-bar code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 1.2rem;
        font-weight: 600;
        letter-spacing: 0.22em;
      }

      .ms-invite-bar button {
        border: 0;
        background: none;
        color: var(--ms-moss);
        font: inherit;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0.35rem 0;
      }

      .ms-tone-night .ms-invite-bar button {
        color: #9ec4a8;
      }

      .ms-event {
        margin: 1rem 0 0;
        font-size: 0.95rem;
        line-height: 1.45;
        color: var(--ms-mute);
      }

      .ms-winner {
        margin: 0.75rem 0 0;
        font-family: var(--font-display);
        font-size: 1.55rem;
        font-weight: 600;
        color: var(--ms-ember);
      }

      .ms-role {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.45rem 0.75rem;
        margin-top: 1.1rem;
      }

      .ms-role-label {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ms-mute);
      }

      .ms-role-value {
        font-family: var(--font-display);
        font-size: 1.35rem;
        font-weight: 600;
      }

      .ms-role-werewolf {
        color: var(--ms-ember);
      }

      .ms-role-seer {
        color: #4a6b8a;
      }

      .ms-role-doctor {
        color: #2f7a58;
      }

      .ms-role-villager {
        color: var(--ms-pine);
      }

      .ms-dead-note {
        width: 100%;
        font-size: 0.82rem;
        color: var(--ms-ember);
      }

      .ms-dock-hint {
        margin: 0 0 0.65rem;
        font-size: 0.82rem;
        color: var(--ms-mute);
        text-align: center;
      }

      .ms-dock {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 20;
        padding: 0.75rem 1.25rem calc(0.9rem + env(safe-area-inset-bottom));
        background: linear-gradient(
          180deg,
          transparent 0%,
          rgba(243, 239, 230, 0.92) 28%,
          var(--ms-bone) 100%
        );
      }

      .ms-tone-night .ms-dock {
        background: linear-gradient(
          180deg,
          transparent 0%,
          rgba(30, 42, 35, 0.92) 28%,
          #18211c 100%
        );
      }

      .ms-dock-panel {
        max-width: 28rem;
        margin: 0 auto;
      }

      .ms-dock-panel h3 {
        margin: 0 0 0.55rem;
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 600;
      }

      .ms-dock-panel > p {
        margin: 0 0 0.65rem;
        font-size: 0.9rem;
        color: var(--ms-mute);
      }

      .ms-dock-wait {
        margin: 0.5rem 0 0 !important;
        font-size: 0.75rem !important;
        text-align: center;
      }

      .ms-you {
        margin: 1.5rem 0 0;
        text-align: center;
        font-size: 0.78rem;
        color: var(--ms-mute);
      }

      .ms-error {
        position: fixed;
        left: 1rem;
        right: 1rem;
        bottom: calc(1rem + env(safe-area-inset-bottom));
        z-index: 40;
        max-width: 28rem;
        margin: 0 auto;
        padding: 0.85rem 1rem;
        border-radius: 0.85rem;
        background: #f8e6e1;
        color: var(--ms-ember-deep);
        font-size: 0.88rem;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(26, 34, 28, 0.12);
        animation: ms-rise 0.25s ease both;
      }

      .ms-room-docked ~ .ms-error,
      .ms-root:has(.ms-room-docked) .ms-error {
        bottom: calc(10.5rem + env(safe-area-inset-bottom));
      }

      @keyframes ms-rise {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes ms-brand-in {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes ms-drift {
        from {
          transform: translateY(0) scale(1);
          opacity: 0.7;
        }
        to {
          transform: translateY(18px) scale(1.04);
          opacity: 1;
        }
      }

      @media (min-width: 640px) {
        .ms-hero,
        .ms-sheet,
        .ms-room {
          max-width: 30rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        .ms-brand {
          font-size: 5rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ms-mist,
        .ms-hero,
        .ms-brand,
        .ms-lead,
        .ms-hero-actions,
        .ms-sheet,
        .ms-room,
        .ms-error {
          animation: none !important;
        }
      }
    `}</style>
  );
}
