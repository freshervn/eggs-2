"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

const TYPING_TTL_MS = 5000;

const USER_COLORS = [
  { bg: "hsl(220 70% 45%)", text: "white" },
  { bg: "hsl(280 60% 45%)", text: "white" },
  { bg: "hsl(340 65% 45%)", text: "white" },
  { bg: "hsl(20 75% 45%)", text: "white" },
  { bg: "hsl(45 70% 40%)", text: "white" },
  { bg: "hsl(160 55% 40%)", text: "white" },
  { bg: "hsl(195 65% 40%)", text: "white" },
  { bg: "hsl(260 55% 50%)", text: "white" },
  { bg: "hsl(320 60% 45%)", text: "white" },
  { bg: "hsl(140 50% 45%)", text: "white" },
] as const;

const getColorForUser = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

export interface ChatMessage {
  id: string;
  text: string;
  username: string;
  displayName: string;
  createdAt: number;
}

export interface ChatRoomSummary {
  id: string;
  participantUsernames: string[];
  participantDisplayNames: string[];
  updatedAt: number;
  createdAt: number;
  lastMessageText: string;
  lastMessageAt: number;
  unreadCounts: Record<string, number>;
  lastReadAtBy: Record<string, number>;
}

export interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  createdAt: number;
}

interface ChatTypingUser {
  username: string;
  displayName: string;
  updatedAt: number;
}

interface ChatPresenceRecord {
  username: string;
  displayName: string;
  isOnline: boolean;
  updatedAt: number;
  lastSeenAt: number;
}

interface ChatRoomProps {
  initialMessages: ChatMessage[];
  initialRooms: ChatRoomSummary[];
  currentUsername: string;
  currentDisplayName?: string;
}

export default function ChatRoom({
  initialMessages,
  initialRooms,
  currentUsername,
  currentDisplayName,
}: ChatRoomProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [messages, setMessages] = useState(initialMessages);
  const [typingUsers, setTypingUsers] = useState<ChatTypingUser[]>([]);
  const [presence, setPresence] = useState<ChatPresenceRecord | null>(null);
  const [activeRoomId, setActiveRoomId] = useState(initialRooms[0]?.id ?? "");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [expandedDateIds, setExpandedDateIds] = useState<Set<string>>(new Set());
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const prevRoomIdRef = useRef<string | null>(null);

  const toggleMessageDate = (messageId: string) => {
    setExpandedDateIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms]
  );

  const getOtherParticipant = (room: ChatRoomSummary) => {
    const otherIndex = room.participantUsernames.findIndex(
      (username) => username !== currentUsername
    );

    if (otherIndex === -1) {
      return {
        username: currentUsername,
        displayName:
          room.participantDisplayNames[0] || currentUsername,
      };
    }

    return {
      username: room.participantUsernames[otherIndex],
      displayName:
        room.participantDisplayNames[otherIndex] ||
        room.participantUsernames[otherIndex],
    };
  };

  const markRoomRead = async (roomId: string) => {
    await fetch(`/api/chat/rooms/${roomId}/read`, {
      method: "POST",
    });
  };

  const formatLastSeen = (value: number) => {
    if (!value) {
      return "Last seen unknown";
    }

    const diffMs = Date.now() - value;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return "Last seen just now";
    }

    if (diffMinutes < 60) {
      return `Last seen ${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return `Last seen ${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `Last seen ${diffDays}d ago`;
  };

  useEffect(() => {
    const query = userSearch.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/chat/users?q=${encodeURIComponent(query)}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to search users.");
        }

        const data = await response.json();
        setSearchResults(Array.isArray(data.users) ? data.users : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [userSearch]);

  useEffect(() => {
    const eventSource = new EventSource("/api/chat/rooms/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "heartbeat") {
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      const nextRooms = Array.isArray(data.rooms) ? data.rooms : [];

      setRooms(nextRooms);
      setError("");
      setActiveRoomId((currentRoomId) => {
        if (!currentRoomId) {
          return nextRooms[0]?.id ?? "";
        }

        const stillExists = nextRooms.some(
          (room: ChatRoomSummary) => room.id === currentRoomId
        );

        return stillExists ? currentRoomId : nextRooms[0]?.id ?? "";
      });
    };

    eventSource.onerror = () => {
      setError("Live room updates disconnected.");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      setTypingUsers([]);
      setPresence(null);
      setExpandedDateIds(new Set());
      setIsLoadingRoom(false);
      prevRoomIdRef.current = null;
      return;
    }

    const isSwitching =
      prevRoomIdRef.current !== null && prevRoomIdRef.current !== activeRoomId;
    prevRoomIdRef.current = activeRoomId;

    if (isSwitching) {
      setMessages([]);
      setIsLoadingRoom(true);
    }
    setExpandedDateIds(new Set());

    const eventSource = new EventSource(`/api/chat/rooms/${activeRoomId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "heartbeat") {
        setTypingUsers((current) =>
          current.filter((user) => Date.now() - user.updatedAt <= TYPING_TTL_MS)
        );
        return;
      }

      if (data.error) {
        setError(data.error);
        setIsLoadingRoom(false);
        return;
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setTypingUsers(Array.isArray(data.typingUsers) ? data.typingUsers : []);
      setPresence(data.presence ?? null);
      setError("");
      setIsLoadingRoom(false);
    };

    eventSource.onerror = () => {
      setError("Live message updates disconnected.");
      setIsLoadingRoom(false);
    };

    return () => {
      eventSource.close();
    };
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId || !activeRoom) {
      return;
    }

    const unreadCount = activeRoom.unreadCounts?.[currentUsername] ?? 0;

    if (unreadCount > 0 && document.visibilityState === "visible") {
      markRoomRead(activeRoomId).catch(() => {});
    }
  }, [activeRoom, activeRoomId, currentUsername, messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessage]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTypingUsers((current) =>
        current.filter((user) => Date.now() - user.updatedAt <= TYPING_TTL_MS)
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncPresence = (method: "POST" | "DELETE") => {
      fetch("/api/chat/presence", {
        method,
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncPresence("POST");
      } else {
        syncPresence("DELETE");
      }
    };

    syncPresence("POST");
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        syncPresence("POST");
      }
    }, 10000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", () => syncPresence("DELETE"));

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      syncPresence("DELETE");
    };
  }, []);

  const shouldBroadcastTyping =
    Boolean(activeRoomId) && isInputFocused && text.trim().length > 0;

  useEffect(() => {
    if (!activeRoomId) {
      return;
    }

    const syncTyping = async (method: "POST" | "DELETE") => {
      await fetch(`/api/chat/rooms/${activeRoomId}/typing`, {
        method,
      });
    };

    if (!shouldBroadcastTyping) {
      syncTyping("DELETE").catch(() => {});
      return;
    }

    syncTyping("POST").catch(() => {});
    const interval = window.setInterval(() => {
      syncTyping("POST").catch(() => {});
    }, 2000);

    return () => {
      window.clearInterval(interval);
      syncTyping("DELETE").catch(() => {});
    };
  }, [activeRoomId, shouldBroadcastTyping]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextText = text.trim();

    if (!nextText) {
      return;
    }

    setIsSending(true);
    setPendingMessage(nextText);
    setText("");
    setError("");

    try {
      if (!activeRoomId) {
        setError("Choose a room first.");
        return;
      }

      const response = await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: nextText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send message.");
        return;
      }

      setTypingUsers([]);
    } catch {
      setError("Failed to send message.");
      setText(nextText);
    } finally {
      setIsSending(false);
      setPendingMessage(null);
    }
  };

  const handleTextareaKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!isSending && activeRoom && text.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  const handleCreateRoom = async (targetUsername: string) => {
    setIsCreatingRoom(true);
    setError("");

    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create room.");
        return;
      }

      if (data.room?.id) {
        setRooms((current) => {
          const withoutDuplicate = current.filter(
            (room) => room.id !== data.room.id
          );
          return [data.room, ...withoutDuplicate];
        });
        setActiveRoomId(data.room.id);
        setUserSearch("");
        setSearchResults([]);
      }
    } catch {
      setError("Failed to create room.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const emptyState = !activeRoom || messages.length === 0;
  const typingLabel =
    typingUsers.length === 0
      ? ""
      : typingUsers.length === 1
      ? `${typingUsers[0].displayName} is typing...`
      : "Several people are typing...";
  const activeStatusLabel = activeRoom
    ? presence?.isOnline
      ? "Online"
      : formatLastSeen(presence?.lastSeenAt ?? activeRoom.lastReadAtBy?.[
          getOtherParticipant(activeRoom).username
        ] ?? 0)
    : "";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl gap-6 py-6">
      <aside className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Private Chat</h1>
          <p className="text-sm text-slate-500">
            Start a 1-to-1 room with another user.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Search users
          </h2>
          <div className="space-y-3">
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search by username or display name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
            <div className="space-y-2">
              {userSearch.trim().length < 2 ? (
                <p className="text-sm text-slate-500">
                  Type at least 2 characters to search.
                </p>
              ) : isSearchingUsers ? (
                <p className="text-sm text-slate-500">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-slate-500">No matching users.</p>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleCreateRoom(user.username)}
                    disabled={isCreatingRoom}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      <span className="block font-medium text-slate-900">
                        {user.displayName}
                      </span>
                      <span className="block text-xs text-slate-500">
                        @{user.username}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">Chat</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your rooms
          </h2>
          <div className="space-y-2">
            {rooms.length === 0 ? (
              <p className="text-sm text-slate-500">
                No private rooms yet.
              </p>
            ) : (
              rooms.map((room) => {
                const other = getOtherParticipant(room);
                const isActive = room.id === activeRoomId;
                const unreadCount = room.unreadCounts?.[currentUsername] ?? 0;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-medium">{other.displayName}</div>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`text-xs ${
                          isActive ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        @{other.username}
                      </div>
                      {unreadCount > 0 ? (
                        <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className={`mt-2 truncate text-xs ${
                        isActive ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {room.lastMessageText || "No messages yet"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {activeRoom ? getOtherParticipant(activeRoom).displayName : "Select a room"}
          </h2>
          <p className="text-sm text-slate-500">
            {activeRoom
              ? `Private room with @${getOtherParticipant(activeRoom).username}`
              : "Choose a user to start chatting."}
          </p>
          {activeRoom ? (
            <p className="mt-1 text-xs text-slate-500">{activeStatusLabel}</p>
          ) : null}
        </div>

        <div className="h-[60vh] space-y-3 overflow-y-auto px-4 py-4">
          {isLoadingRoom ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <span
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
                  aria-hidden
                />
                <p className="text-sm text-slate-500">Loading messages...</p>
              </div>
            </div>
          ) : emptyState && !pendingMessage ? (
            <p className="text-sm text-slate-500">
              {activeRoom
                ? "No messages yet. Start the conversation."
                : "Pick a room or create a new private chat."}
            </p>
          ) : (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.username === currentUsername;
                const { bg, text } = getColorForUser(message.username);

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMessageDate(message.id)}
                      className="max-w-[80%] cursor-pointer rounded-2xl px-4 py-3 text-left transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: bg,
                        color: text,
                      }}
                    >
                      <div className="mb-1 text-xs opacity-75">
                        {message.displayName} @{message.username}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {message.text}
                      </p>
                      {expandedDateIds.has(message.id) ? (
                        <div className="mt-2 text-[11px] opacity-70">
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      ) : null}
                    </button>
                  </div>
                );
              })}
              {pendingMessage ? (
                <div className="flex justify-end">
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-3 text-white"
                    style={{
                      backgroundColor: getColorForUser(currentUsername).bg,
                    }}
                  >
                    <div className="mb-1 text-xs opacity-75">
                      {currentDisplayName ?? currentUsername} @{currentUsername}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {pendingMessage}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] opacity-70">
                      <span
                        className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
                        aria-hidden
                      />
                      Sending...
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
          <div ref={endRef} />
        </div>

        <div className="min-h-6 px-4 text-sm text-slate-500">
          {activeRoom ? typingLabel : ""}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 px-4 py-4"
        >
          <div className="flex gap-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={
                activeRoom ? "Type a message" : "Create or select a room first"
              }
              className="min-h-24 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-black outline-none focus:border-slate-500"
              maxLength={500}
              disabled={!activeRoom}
            />
            <button
              type="submit"
              disabled={isSending || !activeRoom}
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Send
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{text.length}/500</span>
            {error ? <span className="text-red-600">{error}</span> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
