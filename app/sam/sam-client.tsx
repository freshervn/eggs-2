"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SamTable3D, { type Sam3DCard } from "./sam-table-3d";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "2";

type Card = {
  id: string;
  rank: Rank;
  suit: Suit;
  value: number; // 3..15 (2 high)
};

declare global {
  interface Window {
    __sam_botHand?: Card[];
  }
}

type MatchState = {
  id: string;
  status: "ready" | "playing" | "finished";
  yourHand: Card[];
  botHandCount: number;
  pile:
    | {
        type: "set";
        cards: Card[];
        count: number;
        value: number;
      }
    | {
        type: "straight";
        cards: Card[];
        count: number;
        highValue: number;
      }
    | null;
  yourTurn: boolean;
  winner: "you" | "bot" | null;
  log: string[];
  selectedIds: string[];
  trickOwner: "you" | "bot" | null;
  passStreak: 0 | 1 | 2;
};

type Stats = { wins: number; losses: number; updatedAt?: number };

const RANKS: Rank[] = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const DEV_MULTI_CARD_3D = process.env.NEXT_PUBLIC_SAM_DEV_MULTI_CARD_3D === "1";

const makeDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    const value = 3 + RANKS.indexOf(rank);
    for (const suit of SUITS) {
      deck.push({
        id: `${rank}${suit}`,
        rank,
        suit,
        value,
      });
    }
  }
  return deck;
};

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sortHand = (hand: Card[]) => [...hand].sort((a, b) => a.value - b.value);

const asSameRankSet = (cards: Card[]) => {
  if (cards.length === 0) return null;
  const rank = cards[0]?.rank;
  if (!rank) return null;
  if (!cards.every((c) => c.rank === rank)) return null;
  return { count: cards.length, value: cards[0]!.value };
};

const asStraight = (cards: Card[]) => {
  if (cards.length < 3) return null;
  const sorted = [...cards].sort((a, b) => a.value - b.value);
  if (sorted.some((c) => c.rank === "2")) return null;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.value === sorted[i - 1]!.value) return null;
    if (sorted[i]!.value !== sorted[i - 1]!.value + 1) return null;
  }
  return { count: sorted.length, highValue: sorted[sorted.length - 1]!.value, sorted };
};

const asPlay = (cards: Card[]) => {
  const set = asSameRankSet(cards);
  if (set) return { type: "set" as const, cards, count: set.count, value: set.value };
  const straight = asStraight(cards);
  if (straight)
    return {
      type: "straight" as const,
      cards: straight.sorted,
      count: straight.count,
      highValue: straight.highValue,
    };
  return null;
};

const canBeatPlay = (candidateCards: Card[], pile: MatchState["pile"]) => {
  const play = asPlay(candidateCards);
  if (!play) return false;
  if (!pile) return true;
  if (pile.type !== play.type) return false;
  if (pile.count !== play.count) return false;
  return play.type === "set"
    ? play.value > (pile.type === "set" ? pile.value : -1)
    : play.highValue > (pile.type === "straight" ? pile.highValue : -1);
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data: unknown = await res.json();
  if (!res.ok) {
    const err =
      typeof data === "object" && data != null && "error" in data
        ? String((data as { error?: unknown }).error ?? "request_failed")
        : "request_failed";
    throw new Error(err);
  }
  return data as T;
}

export default function SamClient() {
  const table3dRef = useRef<HTMLDivElement | null>(null);
  const [is3dFullscreen, setIs3dFullscreen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"3d" | "2d">(() => {
    if (typeof window === "undefined") return "2d";
    const hasWebgl =
      typeof WebGLRenderingContext !== "undefined" &&
      (() => {
        try {
          const canvas = document.createElement("canvas");
          return !!(
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl") ||
            canvas.getContext("webgl2")
          );
        } catch {
          return false;
        }
      })();
    return hasWebgl ? "3d" : "2d";
  });
  const [match, setMatch] = useState<MatchState>(() => ({
    id: "local",
    status: "ready",
    yourHand: [],
    botHandCount: 0,
    pile: null,
    yourTurn: true,
    winner: null,
    log: ["Nhấn “Bắt đầu” để chia bài."],
    selectedIds: [],
    trickOwner: null,
    passStreak: 0,
  }));

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    fetchJson<{ stats: Stats }>("/api/games/sam/stats")
      .then((r) => {
        if (cancelled) return;
        setStats(r.stats);
      })
      .catch(() => {
        if (cancelled) return;
        setStats({ wins: 0, losses: 0 });
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingStats(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onFs = () => {
      const el = table3dRef.current;
      setIs3dFullscreen(Boolean(el && document.fullscreenElement === el));
    };
    document.addEventListener("fullscreenchange", onFs);
    onFs();
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen3d = async () => {
    const el = table3dRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // ignore (fullscreen not supported / blocked)
    }
  };

  const youHavePlayable = useMemo(() => {
    if (match.status !== "playing" || !match.yourTurn) return false;
    if (!match.pile) return true;
    if (match.pile.type === "set") {
      const neededCount = match.pile.count;
      const ranks = new Map<Rank, { value: number; count: number }>();
      for (const c of match.yourHand) {
        const prev = ranks.get(c.rank);
        ranks.set(c.rank, { value: c.value, count: (prev?.count ?? 0) + 1 });
      }
      for (const v of ranks.values()) {
        if (v.count >= neededCount && v.value > match.pile.value) return true;
      }
      return false;
    }

    // straight
    const neededLen = match.pile.count;
    const minHigh = match.pile.highValue + 1;
    const values = new Set<number>();
    for (const c of match.yourHand) {
      if (c.rank === "2") continue;
      values.add(c.value);
    }
    const sorted = [...values].sort((a, b) => a - b);
    for (const start of sorted) {
      const high = start + neededLen - 1;
      if (high < minHigh) continue;
      let ok = true;
      for (let v = start; v <= high; v++) {
        if (!values.has(v)) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  }, [match.pile, match.status, match.yourHand, match.yourTurn]);

  const canPlayCard = useMemo(() => {
    if (match.status !== "playing" || !match.yourTurn) return () => false;
    return (card: Sam3DCard) => {
      if (DEV_MULTI_CARD_3D) return true;
      if (!match.pile) return true;
      if (match.pile.type !== "set") return false;
      if (match.pile.count !== 1) return false;
      return card.value > match.pile.value;
    };
  }, [match.pile, match.status, match.yourTurn]);

  const start = () => {
    setError("");
    const deck = shuffle(makeDeck());
    const yourHand = sortHand(deck.slice(0, 10));
    const botHand = sortHand(deck.slice(10, 20));
    setMatch({
      id: `local_${Date.now()}`,
      status: "playing",
      yourHand,
      botHandCount: botHand.length,
      pile: null,
      yourTurn: true,
      winner: null,
      log: ["Đã chia 10 lá. Bạn đi trước. (MVP: đánh bộ cùng số hoặc dây)"],
      selectedIds: [],
      trickOwner: null,
      passStreak: 0,
    });
    window.__sam_botHand = botHand;
  };

  const finish = async (winner: "you" | "bot") => {
    setMatch((m) => ({
      ...m,
      status: "finished",
      winner,
      yourTurn: false,
      log: [
        ...m.log,
        winner === "you" ? "Bạn thắng!" : "Bot thắng!",
        "Đang lưu kết quả vào tài khoản…",
      ],
    }));

    try {
      const r = await fetchJson<{ stats: Stats }>("/api/games/sam/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: winner === "you" ? "win" : "loss" }),
      });
      setStats(r.stats);
      setMatch((m) => ({
        ...m,
        log: [...m.log.slice(0, -1), "Đã lưu kết quả."],
      }));
    } catch {
      setMatch((m) => ({
        ...m,
        log: [...m.log.slice(0, -1), "Không lưu được kết quả (API lỗi)."],
      }));
    }
  };

  const botTurn = async () => {
    const botHand: Card[] = window.__sam_botHand || [];
    if (botHand.length === 0) return;

    const pile = match.pile;
    const choosePlay = () => {
      if (!pile) {
        return [botHand[0]!];
      }
      if (pile.type === "set") {
        const neededCount = pile.count;
        const byRank = new Map<Rank, Card[]>();
        for (const c of botHand) {
          const arr = byRank.get(c.rank) ?? [];
          arr.push(c);
          byRank.set(c.rank, arr);
        }
        const candidates: Card[][] = [];
        for (const arr of byRank.values()) {
          if (arr.length >= neededCount && arr[0]!.value > pile.value) {
            candidates.push(arr.slice(0, neededCount));
          }
        }
        candidates.sort((a, b) => a[0]!.value - b[0]!.value);
        return candidates[0] ?? null;
      }

      // straight
      const neededLen = pile.count;
      const minHigh = pile.highValue + 1;
      const byValue = new Map<number, Card>();
      for (const c of botHand) {
        if (c.rank === "2") continue;
        if (!byValue.has(c.value)) byValue.set(c.value, c);
      }
      const values = [...byValue.keys()].sort((a, b) => a - b);
      let best: Card[] | null = null;
      for (const start of values) {
        const high = start + neededLen - 1;
        if (high < minHigh) continue;
        const picked: Card[] = [];
        let ok = true;
        for (let v = start; v <= high; v++) {
          const card = byValue.get(v);
          if (!card) {
            ok = false;
            break;
          }
          picked.push(card);
        }
        if (ok) {
          best = picked;
          break;
        }
      }
      return best;
    };

    const chosenCards = choosePlay();
    if (!chosenCards) {
      setMatch((m) => {
        const nextStreak = (Math.min(2, m.passStreak + 1) as 0 | 1 | 2);
        if (nextStreak >= 2) {
          const owner = m.trickOwner ?? "you";
          return {
            ...m,
            pile: null,
            passStreak: 0,
            yourTurn: owner === "you",
            log: [...m.log, "Bot bỏ lượt. (Hết vòng — dọn bàn)"],
          };
        }
        return {
          ...m,
          passStreak: nextStreak,
          yourTurn: true,
          log: [...m.log, "Bot bỏ lượt."],
        };
      });
      return;
    }

    const chosen = chosenCards[0]!;
    const chosenIds = new Set(chosenCards.map((c) => c.id));
    const nextBot = botHand.filter((c) => !chosenIds.has(c.id));
    window.__sam_botHand = nextBot;
    const play = asPlay(chosenCards);

    setMatch((m) => {
      const nextPile = play
        ? play.type === "set"
          ? ({ type: "set", cards: play.cards, count: play.count, value: play.value } as const)
          : ({ type: "straight", cards: play.cards, count: play.count, highValue: play.highValue } as const)
        : null;

      const label =
        play?.type === "straight"
          ? `dây ${play.count} (cao ${play.highValue})`
          : chosenCards.length > 1
            ? `${chosen.rank} ×${chosenCards.length}`
            : `${chosen.rank}${chosen.suit}`;

      return {
        ...m,
        pile: nextPile,
        botHandCount: nextBot.length,
        yourTurn: true,
        trickOwner: "bot",
        passStreak: 0,
        log: [...m.log, `Bot đánh ${label}.`],
      };
    });

    if (nextBot.length === 0) {
      await finish("bot");
    }
  };

  const toggleSelect = (cardId: string) => {
    if (match.status !== "playing" || !match.yourTurn) return;
    setError("");
    setMatch((m) => {
      const has = m.selectedIds.includes(cardId);
      const next = has ? m.selectedIds.filter((id) => id !== cardId) : [...m.selectedIds, cardId];
      return { ...m, selectedIds: next };
    });
  };

  const playSelected = async () => {
    setError("");
    setMatch((m) => {
      if (m.status !== "playing" || !m.yourTurn) return m;
      const selected = m.selectedIds
        .map((id) => m.yourHand.find((c) => c.id === id))
        .filter((c): c is Card => Boolean(c));
      if (selected.length === 0) {
        setError("Bạn chưa chọn lá nào.");
        return m;
      }
      const play = asPlay(selected);
      if (!play) {
        setError("Bài đã chọn không hợp lệ. (Hỗ trợ: bộ cùng số hoặc dây 3+ không có 2)");
        return m;
      }
      if (!canBeatPlay(selected, m.pile)) {
        setError("Bộ bài đã chọn không đè được.");
        return m;
      }
      const playedIds = new Set(selected.map((c) => c.id));
      const nextHand = m.yourHand.filter((c) => !playedIds.has(c.id));
      return {
        ...m,
        yourHand: nextHand,
        pile:
          play.type === "set"
            ? { type: "set", cards: selected, count: selected.length, value: selected[0]!.value }
            : { type: "straight", cards: play.cards, count: play.count, highValue: play.highValue },
        yourTurn: false,
        selectedIds: [],
        trickOwner: "you",
        passStreak: 0,
        log: [
          ...m.log,
          `Bạn đánh ${
            play.type === "straight"
              ? `dây ${play.count} (cao ${play.highValue})`
              : selected.length > 1
                ? `${selected[0]!.rank} ×${selected.length}`
                : `${selected[0]!.rank}${selected[0]!.suit}`
          }.`,
        ],
      };
    });
  };

  // When yourTurn flips to false after a play, let bot respond.
  useEffect(() => {
    if (match.status !== "playing") return;
    if (match.yourTurn) return;
    if (match.winner) return;
    const timer = setTimeout(() => {
      void botTurn();
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.status, match.yourTurn]);

  useEffect(() => {
    if (match.status !== "playing") return;
    if (match.yourHand.length === 0 && !match.winner) {
      void finish("you");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.status, match.yourHand.length]);

  const pass = () => {
    if (match.status !== "playing" || !match.yourTurn) return;
    setMatch((m) => {
      const nextStreak = (Math.min(2, m.passStreak + 1) as 0 | 1 | 2);
      if (nextStreak >= 2) {
        const owner = m.trickOwner ?? "you";
        return {
          ...m,
          pile: null,
          passStreak: 0,
          selectedIds: [],
          yourTurn: owner === "you",
          log: [...m.log, "Bạn bỏ lượt. (Hết vòng — dọn bàn)"],
        };
      }
      return {
        ...m,
        passStreak: nextStreak,
        yourTurn: false,
        selectedIds: [],
        log: [...m.log, "Bạn bỏ lượt."],
      };
    });
  };

  const topLabel = match.pile
    ? match.pile.type === "straight"
      ? `Dây ${match.pile.count} (cao ${match.pile.highValue})`
      : match.pile.count > 1
        ? `${match.pile.cards[0]!.rank} ×${match.pile.count}`
        : `${match.pile.cards[0]!.rank}${match.pile.cards[0]!.suit}`
    : "—";

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Thống kê</p>
            <p className="mt-1 text-base text-slate-900">
              {loadingStats ? "Đang tải…" : `Thắng ${stats?.wins ?? 0} · Thua ${stats?.losses ?? 0}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={start}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Bắt đầu
            </button>
            <button
              type="button"
              onClick={() => setView((v) => (v === "3d" ? "2d" : "3d"))}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              title="Toggle 2D/3D"
            >
              {view === "3d" ? "3D" : "2D"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setMatch((m) => ({
                  ...m,
                  status: "ready",
                  pile: null,
                  winner: null,
                  yourTurn: true,
                  yourHand: [],
                  botHandCount: 0,
                  log: ["Nhấn “Bắt đầu” để chia bài."],
                  selectedIds: [],
                  trickOwner: null,
                  passStreak: 0,
                }));
                window.__sam_botHand = [];
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {view === "3d" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Bàn 3D</p>
              <p className="mt-1 text-sm text-slate-700">
                {DEV_MULTI_CARD_3D
                  ? "Dev: có thể chọn nhiều lá, rồi bấm “Đánh đã chọn”."
                  : "Click lá bài sáng để đánh. (MVP: chỉ đánh 1 lá)"}
              </p>
            </div>
            <div className="text-sm text-slate-600">
              Bot: <span className="font-semibold text-slate-900">{match.botHandCount}</span> lá
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => void toggleFullscreen3d()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                {is3dFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              </button>
            </div>
            <div ref={table3dRef} className={is3dFullscreen ? "h-[100dvh] w-[100dvw] bg-slate-950 p-3" : ""}>
            <SamTable3D
              yourHand={match.yourHand}
              pileCards={match.pile?.cards ?? null}
              selectedIds={match.selectedIds}
              canPlayCard={canPlayCard}
              onToggleSelect={(id) => toggleSelect(id)}
              opponents={[
                { label: "Bot", count: match.botHandCount },
                { label: "P3", count: 0 },
                { label: "P4", count: 0 },
              ]}
              className={is3dFullscreen ? "h-[calc(100dvh-24px)] w-[calc(100dvw-24px)] border-slate-700" : ""}
            />
            </div>
          </div>

          {match.status === "playing" && match.yourTurn ? (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={pass}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Bỏ lượt
              </button>
              <button
                type="button"
                onClick={() => void playSelected()}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Đánh đã chọn
              </button>
              {!youHavePlayable ? (
                <span className="text-sm text-slate-500">(Bạn không có lá đè được — hãy bỏ lượt)</span>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Bài trên bàn</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{topLabel}</p>
            {match.pile?.cards?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {match.pile.cards.map((c) => (
                  <span
                    key={`pile_${c.id}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-900"
                  >
                    {c.rank}
                    <span className={c.suit === "♥" || c.suit === "♦" ? "text-rose-600" : "text-slate-700"}>
                      {c.suit}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="text-sm text-slate-600">
            Bot: <span className="font-semibold text-slate-900">{match.botHandCount}</span> lá
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              match.status === "playing"
                ? match.yourTurn
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {match.status === "playing"
              ? match.yourTurn
                ? "Lượt của bạn"
                : "Lượt của bot"
              : match.status === "finished"
                ? match.winner === "you"
                  ? "Bạn thắng"
                  : "Bot thắng"
                : "Sẵn sàng"}
          </span>
          {match.status === "playing" && match.yourTurn ? (
            <button
              type="button"
              onClick={pass}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Bỏ lượt
            </button>
          ) : null}
          {match.status === "playing" && match.yourTurn && !youHavePlayable ? (
            <span className="text-sm text-slate-500">(Bạn không có lá đè được — hãy bỏ lượt)</span>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-5">
          <p className="text-sm font-medium text-slate-500">Bài của bạn</p>
          {match.status === "playing" && match.yourTurn ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void playSelected()}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Đánh đã chọn
              </button>
              <button
                type="button"
                onClick={() => setMatch((m) => ({ ...m, selectedIds: [] }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Bỏ chọn
              </button>
              <span className="text-sm text-slate-600">
                Đã chọn: <span className="font-semibold text-slate-900">{match.selectedIds.length}</span>
              </span>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {match.yourHand.length === 0 ? (
              <span className="text-sm text-slate-500">—</span>
            ) : (
              match.yourHand.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleSelect(c.id)}
                  disabled={match.status !== "playing" || !match.yourTurn}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    match.selectedIds.includes(c.id)
                      ? "border-sky-300 bg-sky-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                  title="Click để chọn/bỏ chọn"
                >
                  {c.rank}
                  <span
                    className={
                      c.suit === "♥" || c.suit === "♦" ? "text-rose-600" : "text-slate-700"
                    }
                  >
                    {c.suit}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Nhật ký</p>
        <ol className="mt-2 space-y-1 text-sm text-slate-700">
          {match.log.slice(-10).map((line, idx) => (
            <li key={`${idx}_${line}`}>{line}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Lưu ý: Đây là MVP cực đơn giản (chỉ đánh 1 lá). Nếu bạn muốn đúng luật Sâm lốc
          (đôi/sám/sảnh, chặt 2, báo sâm, 2–4 người), mình sẽ mở rộng tiếp.
        </p>
      </section>
    </div>
  );
}

