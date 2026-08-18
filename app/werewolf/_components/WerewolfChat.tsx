"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWerewolfAvatarDisplay } from "@/_lib/werewolf/avatars";
import type {
  WerewolfChatChannel,
  WerewolfChatMessage,
} from "@/_lib/werewolf/chat-rules";
import { canSendChat } from "@/_lib/werewolf/chat-rules";
import type {
  PlayerStatus,
  WerewolfPhase,
  WerewolfPlayerPublic,
} from "@/_lib/werewolf/types";
import WerewolfAvatarImage from "./WerewolfAvatarImage";

interface WerewolfChatProps {
  roomId: string;
  phase: WerewolfPhase;
  myStatus: PlayerStatus | undefined;
  playerUsername: string;
  playerDisplayName: string;
  players?: WerewolfPlayerPublic[];
  guestQuery: () => string;
  playerBody: () => {
    guestId?: string;
    displayName?: string;
    avatarId?: string;
    avatarUrl?: string;
  };
  devMode?: boolean;
  hasBottomDock?: boolean;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function mockRoomForChat(
  phase: WerewolfPhase,
  myStatus: PlayerStatus | undefined,
  username: string
): Parameters<typeof canSendChat>[0] {
  return {
    id: "dev",
    name: "",
    inviteCode: "",
    hostUsername: "",
    hostDisplayName: "",
    phase,
    dayNumber: 0,
    players: [
      {
        username,
        displayName: "Tester",
        avatarId: "wolf",
        avatarUrl: null,
        status: myStatus ?? "alive",
        role: null,
        isHost: true,
        isBot: false,
      },
    ],
    nightActions: {},
    votes: {},
    seerResults: {},
    winner: null,
    lastEvent: "",
    protectedUsername: null,
    settings: {
      nightDurationSec: 0,
      dayDurationSec: 180,
      voteDurationSec: 90,
      enableSeer: true,
      enableDoctor: true,
      wolfCount: 0,
      revealRolesAtEnd: true,
    },
    phaseEndsAt: null,
    createdAt: 0,
    updatedAt: 0,
  };
}

export default function WerewolfChat({
  roomId,
  phase,
  myStatus,
  playerUsername,
  playerDisplayName,
  players = [],
  guestQuery,
  playerBody,
  devMode = false,
  hasBottomDock = false,
}: WerewolfChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WerewolfChatMessage[]>([]);
  const [canSend, setCanSend] = useState(true);
  const [sendBlockedReason, setSendBlockedReason] = useState("");
  const [activeChannel, setActiveChannel] = useState<WerewolfChatChannel | null>("public");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(open);

  const avatarByUsername = useMemo(() => {
    const map: Record<string, { avatarId: string; avatarUrl: string | null }> = {};
    for (const player of players) {
      map[player.username] = {
        avatarId: player.avatarId,
        avatarUrl: player.avatarUrl,
      };
    }
    return map;
  }, [players]);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!roomId) return;

    if (devMode) {
      const chat = canSendChat(
        mockRoomForChat(phase, myStatus, playerUsername || "dev_me"),
        playerUsername || "dev_me"
      );
      setCanSend(chat.allowed);
      setSendBlockedReason(chat.reason);
      setActiveChannel(chat.channel);
      return;
    }

    let cancelled = false;

    fetch(`/api/werewolf/rooms/${roomId}/messages${guestQuery()}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        setCanSend(Boolean(data.canSend));
        setSendBlockedReason(String(data.sendBlockedReason ?? ""));
        setActiveChannel(
          data.channel === "wolves" || data.channel === "public"
            ? data.channel
            : null
        );
      })
      .catch(() => {});

    const source = new EventSource(
      `/api/werewolf/rooms/${roomId}/messages/stream${guestQuery()}`
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          messages?: WerewolfChatMessage[];
          canSend?: boolean;
          sendBlockedReason?: string;
          channel?: WerewolfChatChannel | null;
        };
        if (payload.messages) {
          setMessages((prev) => {
            if (!openRef.current && payload.messages!.length > prev.length) {
              setUnread((count) => count + (payload.messages!.length - prev.length));
            }
            return payload.messages!;
          });
        }
        if (typeof payload.canSend === "boolean") {
          setCanSend(payload.canSend);
        }
        if (typeof payload.sendBlockedReason === "string") {
          setSendBlockedReason(payload.sendBlockedReason);
        }
        if (payload.channel === "wolves" || payload.channel === "public") {
          setActiveChannel(payload.channel);
        } else if (payload.channel === null) {
          setActiveChannel(null);
        }
      } catch {
        // ignore malformed events
      }
    };

    return () => {
      cancelled = true;
      source.close();
    };
  }, [roomId, guestQuery, devMode, phase, myStatus, playerUsername]);

  useEffect(() => {
    if (devMode) {
      const chat = canSendChat(
        mockRoomForChat(phase, myStatus, playerUsername || "dev_me"),
        playerUsername || "dev_me"
      );
      setCanSend(chat.allowed);
      setSendBlockedReason(chat.reason);
      setActiveChannel(chat.channel);
    }
  }, [devMode, phase, myStatus, playerUsername]);

  useEffect(() => {
    if (open) scrollToEnd();
  }, [messages, open, scrollToEnd]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || !canSend) return;

    setSending(true);
    setError("");

    if (devMode) {
      const message: WerewolfChatMessage = {
        id: `dev_${Date.now()}`,
        text: trimmed,
        username: playerUsername || "dev_me",
        displayName: playerDisplayName || "Tester",
        channel: activeChannel ?? "public",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, message]);
      setText("");
      setSending(false);
      return;
    }

    try {
      const response = await fetch(`/api/werewolf/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, ...playerBody() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Không gửi được tin nhắn.");
        return;
      }
      setText("");
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`ms-chat-toggle ${hasBottomDock ? "ms-chat-toggle-docked" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Đóng chat" : "Mở chat"}
      >
        Chat
        {unread > 0 ? <span className="ms-chat-badge">{unread}</span> : null}
      </button>

      {open ? (
        <div className="ms-chat-overlay" onClick={() => setOpen(false)} />
      ) : null}

      <section
        className={`ms-chat-sheet ${open ? "is-open" : ""} ${
          hasBottomDock ? "ms-chat-sheet-docked" : ""
        }`}
        aria-label="Chat phòng"
        aria-hidden={!open}
      >
        <header className="ms-chat-header">
          <h3>{activeChannel === "wolves" ? "Chat Ma Sói" : "Chat phòng"}</h3>
          <button type="button" onClick={() => setOpen(false)} aria-label="Đóng">
            ✕
          </button>
        </header>

        {activeChannel === "wolves" ? (
          <p className="ms-chat-channel-note">Chỉ Ma Sói thấy tin nhắn này.</p>
        ) : null}

        <div className="ms-chat-messages">
          {messages.length === 0 ? (
            <p className="ms-chat-empty">Chưa có tin nhắn — chào mọi người!</p>
          ) : (
            messages.map((message) => {
              const isMe = message.username === playerUsername;
              const stored = avatarByUsername[message.username];
              const avatar = getWerewolfAvatarDisplay(
                stored?.avatarId,
                stored?.avatarUrl
              );
              return (
                <div key={message.id} className={`ms-chat-row ${isMe ? "is-me" : ""}`}>
                  <span className="ms-chat-avatar">
                    <WerewolfAvatarImage
                      src={avatar.image}
                      alt={message.displayName}
                      size={56}
                      className="ms-chat-avatar-img"
                    />
                  </span>
                  <div
                    className={`ms-chat-bubble ${isMe ? "is-me" : ""} ${
                      message.channel === "wolves" ? "is-wolves" : ""
                    }`}
                  >
                    {!isMe ? (
                      <span className="ms-chat-author">
                        {message.displayName}
                        {message.channel === "wolves" ? " · sói" : ""}
                      </span>
                    ) : null}
                    <p>{message.text}</p>
                    <time dateTime={new Date(message.createdAt).toISOString()}>
                      {formatTime(message.createdAt)}
                    </time>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {error ? <p className="ms-chat-error">{error}</p> : null}

        {canSend ? (
          <form onSubmit={sendMessage} className="ms-chat-form">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                activeChannel === "wolves"
                  ? "Nói với đàn sói…"
                  : "Nhập tin nhắn…"
              }
              maxLength={280}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !text.trim()}>
              Gửi
            </button>
          </form>
        ) : (
          <p className="ms-chat-blocked">{sendBlockedReason}</p>
        )}
      </section>

      <style jsx>{`
        .ms-chat-toggle {
          position: fixed;
          right: 1rem;
          bottom: calc(1rem + env(safe-area-inset-bottom));
          z-index: 25;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          min-height: 2.75rem;
          padding: 0 1rem;
          border: 0;
          border-radius: 999px;
          background: var(--ms-pine);
          color: var(--ms-bone);
          font: inherit;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(26, 34, 28, 0.22);
        }

        .ms-chat-toggle-docked {
          bottom: calc(10.5rem + env(safe-area-inset-bottom));
        }

        .ms-chat-badge {
          display: inline-grid;
          place-items: center;
          min-width: 1.25rem;
          height: 1.25rem;
          padding: 0 0.3rem;
          border-radius: 999px;
          background: var(--ms-ember);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
        }

        .ms-chat-overlay {
          position: fixed;
          inset: 0;
          z-index: 28;
          background: rgba(26, 34, 28, 0.35);
        }

        .ms-chat-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          max-height: min(72dvh, 32rem);
          border-radius: 1.1rem 1.1rem 0 0;
          background: var(--ms-bone);
          color: var(--ms-ink);
          box-shadow: 0 -8px 32px rgba(26, 34, 28, 0.18);
          transform: translateY(105%);
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ms-chat-sheet.is-open {
          transform: translateY(0);
        }

        .ms-chat-sheet-docked.is-open {
          max-height: min(58dvh, 26rem);
        }

        .ms-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem 0.65rem;
          border-bottom: 1px solid rgba(47, 74, 58, 0.12);
        }

        .ms-chat-header h3 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
        }

        .ms-chat-header button {
          border: 0;
          background: none;
          color: var(--ms-mute);
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.25rem;
        }

        .ms-chat-channel-note {
          margin: 0;
          padding: 0.45rem 1rem;
          border-bottom: 1px solid rgba(181, 74, 50, 0.18);
          background: rgba(181, 74, 50, 0.08);
          color: var(--ms-ember-deep);
          font-size: 0.72rem;
          font-weight: 600;
          text-align: center;
        }

        .ms-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .ms-chat-empty {
          margin: auto 0;
          text-align: center;
          font-size: 0.88rem;
          color: var(--ms-mute);
        }

        .ms-chat-row {
          display: flex;
          align-items: flex-end;
          gap: 0.4rem;
          max-width: 88%;
          align-self: flex-start;
        }

        .ms-chat-row.is-me {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .ms-chat-avatar {
          display: block;
          flex-shrink: 0;
          overflow: hidden;
          width: 1.65rem;
          height: 1.65rem;
          border-radius: 999px;
          background: rgba(47, 74, 58, 0.12);
        }

        .ms-chat-avatar :global(.ms-chat-avatar-img) {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ms-chat-bubble {
          padding: 0.55rem 0.75rem;
          border-radius: 0.85rem 0.85rem 0.85rem 0.2rem;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(47, 74, 58, 0.1);
        }

        .ms-chat-bubble.is-me {
          border-radius: 0.85rem 0.85rem 0.2rem 0.85rem;
          background: var(--ms-pine);
          color: var(--ms-bone);
          border-color: transparent;
        }

        .ms-chat-bubble.is-wolves:not(.is-me) {
          background: rgba(181, 74, 50, 0.1);
          border-color: rgba(181, 74, 50, 0.22);
        }

        .ms-chat-bubble.is-me.is-wolves {
          background: var(--ms-ember-deep);
        }

        .ms-chat-author {
          display: block;
          margin-bottom: 0.15rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--ms-moss);
        }

        .ms-chat-bubble.is-me .ms-chat-author {
          color: rgba(243, 239, 230, 0.85);
        }

        .ms-chat-bubble p {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .ms-chat-bubble time {
          display: block;
          margin-top: 0.2rem;
          font-size: 0.65rem;
          opacity: 0.65;
        }

        .ms-chat-form {
          display: flex;
          gap: 0.5rem;
          padding: 0.65rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(47, 74, 58, 0.12);
        }

        .ms-chat-form input {
          flex: 1;
          min-height: 2.75rem;
          border: 1.5px solid rgba(47, 74, 58, 0.22);
          border-radius: 0.75rem;
          background: #fff;
          padding: 0 0.85rem;
          font: inherit;
          font-size: 0.95rem;
          color: var(--ms-ink);
          outline: none;
        }

        .ms-chat-form input:focus {
          border-color: var(--ms-pine);
        }

        .ms-chat-form button {
          flex-shrink: 0;
          min-width: 3.5rem;
          min-height: 2.75rem;
          border: 0;
          border-radius: 0.75rem;
          background: var(--ms-pine);
          color: var(--ms-bone);
          font: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .ms-chat-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ms-chat-blocked {
          margin: 0;
          padding: 0.85rem 1rem calc(0.9rem + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(47, 74, 58, 0.12);
          text-align: center;
          font-size: 0.82rem;
          color: var(--ms-mute);
        }

        .ms-chat-error {
          margin: 0;
          padding: 0 1rem 0.35rem;
          font-size: 0.8rem;
          color: var(--ms-ember-deep);
        }
      `}</style>
    </>
  );
}
