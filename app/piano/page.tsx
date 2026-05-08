"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** 10 lanes by touch-typing fingers. Example: Q/A/Z are lane 1. */
const LANES = [
  { label: "QAZ", finger: "Ngón út", fingerType: "pinky", keys: ["q", "a", "z"] },
  { label: "WSX", finger: "Ngón áp út", fingerType: "ring", keys: ["w", "s", "x"] },
  { label: "EDC", finger: "Ngón giữa", fingerType: "middle", keys: ["e", "d", "c"] },
  { label: "RFV", finger: "Ngón trỏ", fingerType: "index", keys: ["r", "f", "v"] },
  { label: "TGB", finger: "Ngón trỏ", fingerType: "index", keys: ["t", "g", "b"] },
  { label: "YHN", finger: "Ngón trỏ", fingerType: "index", keys: ["y", "h", "n"] },
  { label: "UJM", finger: "Ngón trỏ", fingerType: "index", keys: ["u", "j", "m"] },
  { label: "IK", finger: "Ngón giữa", fingerType: "middle", keys: ["i", "k"] },
  { label: "OL", finger: "Ngón áp út", fingerType: "ring", keys: ["o", "l"] },
  { label: "P", finger: "Ngón út", fingerType: "pinky", keys: ["p"] },
] as const;

function fingerTintClass(t: (typeof LANES)[number]["fingerType"]) {
  switch (t) {
    case "pinky":
      return "bg-rose-500/10 ring-rose-500/30";
    case "ring":
      return "bg-amber-500/10 ring-amber-500/30";
    case "middle":
      return "bg-emerald-500/10 ring-emerald-500/30";
    case "index":
      return "bg-sky-500/10 ring-sky-500/30";
    default:
      return "bg-white/0 ring-white/0";
  }
}

const LANE_COUNT = LANES.length;

type Tile = {
  id: string;
  lane: number;
  keyChar: string;
  /** Vertical position: 0 = top of track, 100 = bottom (past hit line). */
  y: number;
  /** Visual height (% of track). Long bricks use a taller body. */
  hPct?: number;
  /** Scored once already (for long bricks held on the line). */
  scored?: boolean;
  /** Correct key was pressed once — brick stays green and keeps easing down until it crosses the line. */
  armed?: boolean;
};

type GamePhase = "ready" | "playing" | "paused" | "gameover";

type HitPulse = { id: number; lane: number };
type WrongPulse = { id: number; lane: number };
type LeaderboardEntry = {
  userId: string;
  username: string;
  displayName?: string;
  bestScore: number;
  updatedAt: number;
};

const HIT_Y = 82;
/** Must match rendered tile wrapper `height` — used to know when the brick touches the cyan line. */
const BRICK_BODY_PCT_NORMAL = 8;
const BRICK_BODY_PCT_FULLSCREEN = 6;
const HIT_WINDOW_BEFORE = 14;
const HIT_WINDOW_AFTER = 10;
const MISS_Y = 100;
/** Any brick between here and MISS_Y counts as \"on board\" for a one-key catch. */
const CATCH_MIN_Y = -14;
const LONG_BRICK_MULT = 2;

/** Fixed pace — no speedup as score increases. */
const DROP_SPEED = 0.018;
const SPEEDUP_PER_LOOP = 1.06;
const MAX_SPEED_MULT = 2.75;
// Spawn is distance-based (see rAF loop) so bricks have no vertical gaps.

/** Fixed note set (Hz) used for brick/game sounds. */
const NOTE_SET_HZ = [329.63, 369.99, 392.0, 440.0, 493.88, 587.33] as const;
const NOTE_SET_LABELS = ["E4", "F#4", "G4", "A4", "B4", "D5"] as const;

function midiToNoteName(midi: number) {
  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ] as const;
  const pc = ((midi % 12) + 12) % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${names[pc]}${oct}`;
}

function codeToTypingNoteName(code: string) {
  const idx = CODE_TO_TYPING_INDEX.get(code);
  if (idx === undefined) return null;
  return midiToNoteName(60 + idx);
}

function codeToDisplayLabel(code: string) {
  if (code.startsWith("Key")) return code.slice(3);
  switch (code) {
    case "BracketLeft":
      return "[";
    case "BracketRight":
      return "]";
    case "Backslash":
      return "\\";
    case "Semicolon":
      return ";";
    case "Quote":
      return "'";
    case "Comma":
      return ",";
    case "Period":
      return ".";
    case "Slash":
      return "/";
    default:
      return code;
  }
}

/**
 * Brick spawn order (loops) matching your script.
 * `—` means a long brick (taller).
 *
 * O—   O   O   I
 * U    I   O—
 *
 * ]—   ]   P   O
 * I    U—
 *
 * O—   O   O   I
 * U    I   O—
 *
 * ]—   P   O   I
 * U    Y   T—
 *
 * Lane mapping:
 * Q=0 W=1 E=2 R=3 T=4 Y=5 U=6 I=7 O=8 P=9 ]=10
 */
const MELODY_STEPS = [
  { lane: 8, long: true },
  { lane: 8, long: false },
  { lane: 8, long: false },
  { lane: 7, long: false },
  { lane: 6, long: false },
  { lane: 7, long: false },
  { lane: 8, long: true },
  { lane: 10, long: true },
  { lane: 10, long: false },
  { lane: 9, long: false },
  { lane: 8, long: false },
  { lane: 7, long: false },
  { lane: 6, long: true },
  { lane: 8, long: true },
  { lane: 8, long: false },
  { lane: 8, long: false },
  { lane: 7, long: false },
  { lane: 6, long: false },
  { lane: 7, long: false },
  { lane: 8, long: true },
  { lane: 10, long: true },
  { lane: 9, long: false },
  { lane: 8, long: false },
  { lane: 7, long: false },
  { lane: 6, long: false },
  { lane: 5, long: false },
  { lane: 4, long: true },
] as const;

type ScriptStep = { lane: number; keyChar: string; long: boolean };

const PRESET_SCRIPTS = {
  "Luyện tay trái (qwert/asdfg/zxcvb)": `q w e r t
a s d f g
z x c v b

t r e w q
g f d s a
b v c x z`,
  "Luyện tay phải (yuiop/hjkl/nm)": `y u i o p
h j k l o
n m j k l

p o i u y
l k j h u
m n h j k`,
  "Luyện cả hai tay (trái ↔ phải)": `q w e r t y u i o p
a s d f g h j k l o
z x c v b n m j k l

p o i u y t r e w q
o l k j h g f d s a`,
  "Telex dấu (s f r x j)": `a as af ar ax aj
e es ef er ex ej
i is if ir ix ij
o os of or ox oj
u us uf ur ux uj
y ys yf yr yx yj`,
  "Telex tiếng Việt (ví dụ)": `Nam quốc sơn hà
Tiệt nhiên định phận tại thiên thư
Như hà nghịch lỗ lai xâm phạm
Nhữ đẳng hành khan thủ bại hư`,
} as const;

function viCharToTelexKeys(inputChar: string): string[] {
  const ch = (inputChar || "").toLowerCase();
  if (!ch) return [];
  if (ch === "đ") return ["d", "d"];

  // Decompose and map combining marks to Telex keys.
  const nfd = ch.normalize("NFD");
  const base = nfd[0] ?? "";
  if (!/^[a-z]$/u.test(base)) return [];

  let extra: string[] = [];
  let tone: string | null = null;

  for (let i = 1; i < nfd.length; i++) {
    const mark = nfd[i]!;
    // Shape/diacritic marks.
    if (mark === "\u0302") {
      // circumflex: â ê ô => aa/ee/oo
      extra.push(base);
      continue;
    }
    if (mark === "\u0306") {
      // breve: ă => aw
      extra.push("w");
      continue;
    }
    if (mark === "\u031b") {
      // horn: ơ ư => ow/uw
      extra.push("w");
      continue;
    }

    // Tone marks.
    if (mark === "\u0301") tone = "s"; // sắc
    else if (mark === "\u0300") tone = "f"; // huyền
    else if (mark === "\u0309") tone = "r"; // hỏi
    else if (mark === "\u0303") tone = "x"; // ngã
    else if (mark === "\u0323") tone = "j"; // nặng
  }

  const out = [base, ...extra];
  if (tone) out.push(tone);
  return out.filter((k) => /^[a-z]$/u.test(k));
}

function parseScript(text: string): { steps: ScriptStep[]; error: string | null } {
  const steps: ScriptStep[] = [];
  const raw = (text ?? "").replace(/[\u2014\u2013\u2011\u2212]/gu, "-");

  // Convert any input text to a stream of Telex keystrokes.
  for (const c of raw) {
    // Treat whitespace as a "hold" marker: make the previous tile long (2x).
    if (c === " " || c === "\n" || c === "\t") {
      const last = steps.at(-1);
      if (last) last.long = true;
      continue;
    }

    // Preserve the old "long brick" marker if user types '-' immediately after a key/char.
    if (c === "-") {
      const last = steps.at(-1);
      if (last) last.long = true;
      continue;
    }

    const keys = viCharToTelexKeys(c);
    for (const k of keys) {
      const lane = LANES.findIndex((l) =>
        (l.keys as readonly string[]).includes(k),
      );
      if (lane >= 0) steps.push({ lane, keyChar: k, long: false });
    }
  }

  if (steps.length === 0) {
    return { steps: [], error: "Chưa tạo được phím Telex từ nội dung bạn nhập." };
  }
  return { steps, error: null };
}

function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Physical keyboard coverage Q..?: one unique chromatic note per key. */
const KEYBOARD_Q_TO_SLASH_CODES = [
  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT",
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",
  "Semicolon",
  "Quote",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",
  "KeyN",
  "KeyM",
  "Comma",
  "Period",
  "Slash",
] as const;

const CODE_TO_TYPING_INDEX = new Map<string, number>(
  KEYBOARD_Q_TO_SLASH_CODES.map((c, i) => [c, i]),
);

function codeToTypingHz(code: string) {
  const idx = CODE_TO_TYPING_INDEX.get(code);
  if (idx === undefined) return null;
  // Unique pitch per key (Q..?/ block).
  return midiToFreq(60 + idx); // C4 upward chromatic
}

// (typing sound reverted) no per-key ADSR scheduling

function fallbackCodeToTypingHz(code: string) {
  // Stable hash -> wide chromatic range so every key differs.
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % 36; // 3 octaves
  return midiToFreq(60 + idx);
}

function laneToBrickHz(lane: number) {
  // Brick keys keep the fixed Hz set (requested earlier).
  return NOTE_SET_HZ[lane % NOTE_SET_HZ.length] ?? null;
}

function eventToLaneKey(e: KeyboardEvent): string | null {
  const k = e.key;
  if (k.length !== 1) return null;
  const lower = k.toLowerCase();
  if (!/^[a-z]$/u.test(lower)) return null;
  return lower;
}

let tileId = 0;
function nextTileId() {
  tileId += 1;
  return `t-${tileId}`;
}

let hitPulseId = 0;
function nextHitPulseId() {
  hitPulseId += 1;
  return hitPulseId;
}

let wrongPulseId = 0;
function nextWrongPulseId() {
  wrongPulseId += 1;
  return wrongPulseId;
}

export default function PianoPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [customPresets, setCustomPresets] = useState<Record<string, string>>({});
  const DEFAULT_PRESET = "Luyện cả hai tay (trái ↔ phải)" as const;
  const [scriptPreset, setScriptPreset] = useState<string>(DEFAULT_PRESET);
  const [scriptText, setScriptText] = useState<string>(PRESET_SCRIPTS[DEFAULT_PRESET]);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [pressedLane, setPressedLane] = useState<number | null>(null);
  const [flash, setFlash] = useState<"hit" | "miss" | "empty" | null>(null);
  const [hitPulses, setHitPulses] = useState<HitPulse[]>([]);
  const [wrongPulses, setWrongPulses] = useState<WrongPulse[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brickBodyPct, setBrickBodyPct] = useState(BRICK_BODY_PCT_NORMAL);
  const [accountName, setAccountName] = useState<string>("Guest");
  const [bestScore, setBestScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const tilesRef = useRef<Tile[]>([]);
  const speedMultRef = useRef(1);
  const brickBodyPctRef = useRef(BRICK_BODY_PCT_NORMAL);
  const longBrickBodyPctRef = useRef(BRICK_BODY_PCT_NORMAL * LONG_BRICK_MULT);
  /** Always-current phase/combo so key handlers never lag one render behind stale useCallback closures. */
  const phaseRef = useRef<GamePhase>("ready");
  const comboRef = useRef(0);
  phaseRef.current = phase;
  comboRef.current = combo;

  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const audioRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const heldNotesRef = useRef<
    Map<string, { osc: OscillatorNode; g: GainNode }>
  >(new Map());

  /** Create routing synchronously inside a user gesture so browsers allow sound. */
  const primeAudioGraph = useCallback(() => {
    const AudioContextCtor =
      typeof window !== "undefined" &&
      (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext);
    if (!AudioContextCtor) return;

    if (!audioRef.current) {
      const ctx = new AudioContextCtor();
      const gain = ctx.createGain();
      gain.gain.value = 0.36;

      const comp = ctx.createDynamicsCompressor();
      // Keep notes audible/clear without clipping.
      comp.threshold.value = -18;
      comp.knee.value = 18;
      comp.ratio.value = 6;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;

      gain.connect(comp);
      comp.connect(ctx.destination);
      audioRef.current = ctx;
      masterGainRef.current = gain;
      compressorRef.current = comp;
    }
  }, []);

  const runWhenAudioRuns = useCallback(
    (play: () => void) => {
      primeAudioGraph();
      const ctx = audioRef.current;
      if (!ctx) return;

      const go = () => {
        try {
          play();
        } catch {
          /* ignore schedule errors */
        }
      };

      if (ctx.state === "running") {
        setStarted(true);
        go();
        return;
      }

      void ctx.resume().then(() => {
        setStarted(true);
        go();
      });
    },
    [primeAudioGraph],
  );

  // Distance accumulator (in % units), used to spawn bricks with no gaps.
  const spawnAccRef = useRef(0);
  const melodyIdxRef = useRef(0);
  const scriptStepsRef = useRef<ScriptStep[]>([]);
  const spawnCursorYRef = useRef<number>(0);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("pianoScriptText");
    if (saved) setScriptText(saved);
    const savedPreset = window.localStorage.getItem("pianoScriptPreset");
    if (savedPreset) setScriptPreset(savedPreset);

    const savedCustom = window.localStorage.getItem("pianoCustomPresets");
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom) as unknown;
        if (parsed && typeof parsed === "object") {
          setCustomPresets(parsed as Record<string, string>);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setAccountName("Guest");
          return;
        }
        const data = (await res.json()) as { user?: { displayName?: string; username?: string } | null };
        const name =
          data?.user?.displayName?.trim() ||
          data?.user?.username?.trim() ||
          "Guest";
        setAccountName(name);
      } catch {
        // ignore
      }
    })();
    return () => ctrl.abort();
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    try {
      setLeaderboardError(null);
      const res = await fetch("/api/games/piano/leaderboard", { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as {
        entries?: LeaderboardEntry[];
        error?: string;
      };
      if (!res.ok) {
        setLeaderboard([]);
        setLeaderboardError(
          typeof data?.error === "string"
            ? data.error
            : "Không tải được bảng xếp hạng (Firebase / máy chủ).",
        );
        return;
      }
      setLeaderboard(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setLeaderboard([]);
      setLeaderboardError("Lỗi mạng khi tải bảng xếp hạng.");
    }
  }, []);

  useEffect(() => {
    // Load my saved best score if logged in.
    (async () => {
      try {
        const res = await fetch("/api/games/piano/score", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { bestScore?: number };
        setBestScore(Math.max(0, Math.floor(Number(data.bestScore ?? 0))));
      } catch {
        // ignore
      }
    })();
    void refreshLeaderboard();
  }, [refreshLeaderboard]);

  useEffect(() => {
    if (phase !== "gameover") return;
    const nextBest = Math.max(bestScore, score);
    setBestScore(nextBest);
    // Save score (only works for logged-in users).
    (async () => {
      try {
        await fetch("/api/games/piano/score", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lastScore: score, bestScore: nextBest }),
        });
      } catch {
        // ignore
      } finally {
        void refreshLeaderboard();
      }
    })();
  }, [bestScore, phase, refreshLeaderboard, score]);

  const applyScript = useCallback((text: string) => {
      const parsed = parseScript(text);
      setScriptError(parsed.error);
      if (parsed.error) return;
      scriptStepsRef.current = parsed.steps;
      melodyIdxRef.current = 0;
      window.localStorage.setItem("pianoScriptText", text);
    }, []);

  const allPresets = useMemo(() => {
    return { ...PRESET_SCRIPTS, ...customPresets } as Record<string, string>;
  }, [customPresets]);

  useEffect(() => {
    // If user has an old saved preset that's no longer in defaults,
    // fall back to the default to avoid a blank selection.
    if (!allPresets[scriptPreset]) {
      setScriptPreset(DEFAULT_PRESET);
      setScriptText(PRESET_SCRIPTS[DEFAULT_PRESET]);
      window.localStorage.setItem("pianoScriptPreset", DEFAULT_PRESET);
    }
  }, [allPresets, scriptPreset]);

  const savePreset = useCallback(() => {
    const parsed = parseScript(scriptText);
    setScriptError(parsed.error);
    if (parsed.error) return;

    const rawName = window.prompt("Tên mẫu (mẫu có sẵn sẽ không bị ghi đè):", "");
    const name = (rawName ?? "").trim();
    if (!name) return;
    if (name in PRESET_SCRIPTS) {
      window.alert("Tên này trùng với mẫu có sẵn. Hãy chọn tên khác.");
      return;
    }

    setCustomPresets((prev) => {
      const next = { ...prev, [name]: scriptText };
      window.localStorage.setItem("pianoCustomPresets", JSON.stringify(next));
      window.localStorage.setItem("pianoScriptPreset", name);
      return next;
    });
    setScriptPreset(name);
  }, [scriptText]);

  useEffect(() => {
    // Keep current script applied on load / when user edits.
    applyScript(scriptText);
  }, [applyScript, scriptText]);

  const keyToLane = useMemo(() => {
    const m = new Map<string, number>();
    LANES.forEach((l, i) => l.keys.forEach((k) => m.set(k, i)));
    return m;
  }, []);

  const ensureAudio = useCallback(async () => {
    setError(null);
    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextCtor) throw new Error("Web Audio is not supported.");

      primeAudioGraph();
      const ctx = audioRef.current;
      if (!ctx) throw new Error("Web Audio is not supported.");

      if (ctx.state !== "running") {
        await ctx.resume();
      }

      setStarted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start audio");
    }
  }, [primeAudioGraph]);

  const playBlip = useCallback(
    (lane: number, kind: "hit" | "bad" | "ring") => {
      runWhenAudioRuns(() => {
        const ctx = audioRef.current;
        const out = masterGainRef.current;
        if (!ctx || !out) return;

        const now = ctx.currentTime;
        const pan = LANE_COUNT > 1 ? (lane / (LANE_COUNT - 1)) * 2 - 1 : 0;
        const brickHz =
          laneToBrickHz(lane) ?? NOTE_SET_HZ[lane % NOTE_SET_HZ.length]!;

        if (kind === "ring") {
          const baseHz = brickHz;
          const laneBoost = 1;

          const osc1 = ctx.createOscillator();
          const g1 = ctx.createGain();
          osc1.type = "triangle";
          osc1.frequency.value = baseHz;

          const osc2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.value = baseHz * 2;
          // Small lane-dependent detune to make notes more distinct on small speakers.
          osc2.detune.value = 6 + lane * 3;

          osc1.connect(g1);
          osc2.connect(g2);
          const p1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
          const p2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
          if (p1) {
            p1.pan.value = pan;
            g1.connect(p1);
            p1.connect(out);
          } else {
            g1.connect(out);
          }
          if (p2) {
            p2.pan.value = pan * 0.85;
            g2.connect(p2);
            p2.connect(out);
          } else {
            g2.connect(out);
          }

          g1.gain.setValueAtTime(0.0001, now);
          g2.gain.setValueAtTime(0.0001, now);
          g1.gain.exponentialRampToValueAtTime(1.0 * laneBoost, now + 0.012);
          g2.gain.exponentialRampToValueAtTime(0.42 * laneBoost, now + 0.012);
          g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
          g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.58);
          osc2.stop(now + 0.58);
          return;
        }

        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = kind === "bad" ? "sawtooth" : "sine";
        osc.frequency.value = kind === "bad" ? 120 : brickHz;
        osc.connect(g);
        const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (p) {
          p.pan.value = pan;
          g.connect(p);
          p.connect(out);
        } else {
          g.connect(out);
        }
        g.gain.setValueAtTime(0.0001, now);
        if (kind === "hit") {
          g.gain.exponentialRampToValueAtTime(0.78, now + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.14);
        } else {
          g.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.14);
        }
      });
    },
    [runWhenAudioRuns],
  );

  const startTypingNote = useCallback(
    (code: string, hz: number) => {
      if (heldNotesRef.current.has(code)) return;
      runWhenAudioRuns(() => {
        const ctx = audioRef.current;
        const out = masterGainRef.current;
        if (!ctx || !out) return;
        if (heldNotesRef.current.has(code)) return;

        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = hz;
        osc.connect(g);

        const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (p) {
          const pan = Math.max(
            -1,
            Math.min(1, (Math.log2(hz / 440) / 2) * 0.9),
          );
          p.pan.value = pan;
          g.connect(p);
          p.connect(out);
        } else {
          g.connect(out);
        }

        const now = ctx.currentTime;
        // ADSR-ish: fast attack, decay to sustain, release on keyup.
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.75, now + 0.015); // attack
        g.gain.exponentialRampToValueAtTime(0.22, now + 0.09); // decay -> sustain
        osc.start(now);

        heldNotesRef.current.set(code, { osc, g });
      });
    },
    [runWhenAudioRuns],
  );

  const stopTypingNote = useCallback((code: string) => {
    const n = heldNotesRef.current.get(code);
    if (!n) return;
    heldNotesRef.current.delete(code);

    const ctx = audioRef.current;
    if (!ctx) {
      try {
        n.osc.stop();
      } catch {}
      return;
    }

    const now = ctx.currentTime;
    n.g.gain.cancelScheduledValues(now);
    n.g.gain.setValueAtTime(Math.max(0.0001, n.g.gain.value || 0.0001), now);
    n.g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    try {
      n.osc.stop(now + 0.14);
    } catch {}
  }, []);

  const resetRun = useCallback(() => {
    tilesRef.current = [];
    spawnAccRef.current = 0;
    melodyIdxRef.current = 0;
    spawnCursorYRef.current = 0;
    lastTsRef.current = null;
    speedMultRef.current = 1;
    setScore(0);
    setCombo(0);
    setLives(3);
    setPhase("ready");
    setFlash(null);
    setHitPulses([]);
    setWrongPulses([]);
    bump();
  }, [bump]);

  const beginPlay = useCallback(() => {
    tilesRef.current = [];
    spawnAccRef.current = 0;
    melodyIdxRef.current = 0;
    spawnCursorYRef.current = 0;
    lastTsRef.current = null;
    speedMultRef.current = 1;
    setScore(0);
    setCombo(0);
    setLives(3);
    setPhase("playing");
    setFlash(null);
    setHitPulses([]);
    setWrongPulses([]);
    bump();
  }, [bump]);

  const resumePlay = useCallback(() => {
    lastTsRef.current = null;
    setPhase("playing");
    bump();
  }, [bump]);

  const startFromCold = useCallback(async () => {
    await ensureAudio();
    beginPlay();
  }, [beginPlay, ensureAudio]);

  /** rAF loop: move tiles, armed line hits, spawn, misses */
  useEffect(() => {
    if (phase !== "playing") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      return;
    }

    const brickTouchesHitLine = (yTop: number, hPct: number) => yTop <= HIT_Y && yTop + hPct >= HIT_Y;

    const registerWindowHit = (lane: number, dist: number) => {
      const combo = comboRef.current;
      const perfect = dist < 3;
      setScore((s) => s + (perfect ? 120 : 80) + Math.min(50, combo * 2));
      setCombo((c) => c + 1);
      setFlash("hit");
      const pulseId = nextHitPulseId();
      setHitPulses((p) => [...p, { id: pulseId, lane }]);
      setTimeout(() => {
        setHitPulses((p) => p.filter((x) => x.id !== pulseId));
      }, 220);
      setTimeout(() => setFlash(null), 80);
    };

    const loop = (ts: number) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      const dt = last == null ? 16 : Math.min(48, ts - last);

      const speed = DROP_SPEED * speedMultRef.current;
      const tiles = tilesRef.current;
      let changed = false;

      // Keep the spawn cursor moving with the stack so new bricks stay touching.
      const dy = speed * dt; // % units
      spawnCursorYRef.current += dy;

      for (let i = tiles.length - 1; i >= 0; i--) {
        const t = tiles[i]!;
        const hPct = t.hPct ?? brickBodyPctRef.current;
        if (t.armed && brickTouchesHitLine(t.y, hPct)) {
          const brickCenter = t.y + hPct / 2;
          const dist = Math.abs(brickCenter - HIT_Y);

          registerWindowHit(t.lane, dist);
          tiles.splice(i, 1);
          changed = true;
          continue;
        }

        const ny = t.y + dy;
        if (ny + hPct >= MISS_Y) {
          tiles.splice(i, 1);
          changed = true;
          if (t.armed) {
            setCombo(0);
          } else {
            setLives((lv) => {
              const n = lv - 1;
              if (n <= 0) setPhase("gameover");
              return Math.max(0, n);
            });
            setCombo(0);
            setFlash("miss");
            setTimeout(() => setFlash(null), 120);
          }
        } else {
          if (ny !== t.y) {
            tiles[i] = { ...t, y: ny };
            changed = true;
          }
        }
      }

      // Spawn when the stack has moved down by a full brick height.
      spawnAccRef.current += dy;
      while (true) {
        const steps = scriptStepsRef.current;
        const step = steps[melodyIdxRef.current % steps.length] ?? {
          lane: 0,
          keyChar: "q",
          long: false,
        };
        const hPct = step.long ? longBrickBodyPctRef.current : brickBodyPctRef.current;
        if (spawnAccRef.current < hPct) break;
        spawnAccRef.current -= hPct;
        const nextIdx = (melodyIdxRef.current + 1) % steps.length;
        melodyIdxRef.current = nextIdx;
        // Speed up every time we finish one full script loop.
        if (nextIdx === 0) {
          speedMultRef.current = Math.min(
            MAX_SPEED_MULT,
            speedMultRef.current * SPEEDUP_PER_LOOP,
          );
        }
        // Stack bricks globally with no vertical gaps (even across lanes).
        const y = spawnCursorYRef.current - hPct;
        spawnCursorYRef.current = y;
        tiles.push({
          id: nextTileId(),
          lane: step.lane,
          keyChar: step.keyChar,
          y,
          hPct,
        });
        changed = true;
      }

      if (changed) bump();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      lastTsRef.current = null;
    };
  }, [bump, phase, playBlip]);

  const tryHitKey = useCallback(
    (lane: number, keyChar: string) => {
      if (phaseRef.current !== "playing") return;

      const tiles = tilesRef.current;
      let armIdx: number | null = null;
      let bestY = -Infinity;
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i]!;
        if (t.lane !== lane || t.armed) continue;
        if (t.keyChar !== keyChar) continue;
        if (t.y < CATCH_MIN_Y || t.y >= MISS_Y) continue;
        if (t.y > bestY) {
          bestY = t.y;
          armIdx = i;
        }
      }

      const hasArmedWaiting = tiles.some(
        (t) => t.lane === lane && t.keyChar === keyChar && t.armed && t.y < MISS_Y,
      );
      if (armIdx === null) {
        if (hasArmedWaiting) return;
        setCombo(0);
        setScore((s) => Math.max(0, s - 15));
        setFlash("empty");
        playBlip(lane, "bad");
        const wpId = nextWrongPulseId();
        setWrongPulses((p) => [...p, { id: wpId, lane }]);
        setTimeout(() => {
          setWrongPulses((p) => p.filter((x) => x.id !== wpId));
        }, 160);
        bump();
        setTimeout(() => setFlash(null), 100);
        return;
      }

      const struck = tiles[armIdx]!;
      tiles[armIdx] = { ...struck, armed: true };
      bump();
    },
    [bump, playBlip],
  );

  const wrongLaneSet = useMemo(() => {
    const s = new Set<number>();
    wrongPulses.forEach((p) => s.add(p.lane));
    return s;
  }, [wrongPulses]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code === "Tab") return;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") return;

      // Start the falling-tiles game on the first key press.
      if (phaseRef.current === "ready") {
        void (started ? beginPlay() : startFromCold());
      }

      // Typing sound: start on keydown, sustain while held, release on keyup.
      const typingHz = codeToTypingHz(e.code) ?? fallbackCodeToTypingHz(e.code);
      if (CODE_TO_TYPING_INDEX.has(e.code)) e.preventDefault();
      startTypingNote(e.code, typingHz);

      const lk = eventToLaneKey(e);
      if (!lk) return;
      const lane = keyToLane.get(lk);
      if (lane === undefined) return;
      e.preventDefault();
      setPressedLane(lane);
      if (phaseRef.current === "playing") {
        tryHitKey(lane, lk);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code === "Tab") return;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") return;
      stopTypingNote(e.code);

      const lk = eventToLaneKey(e);
      if (!lk) return;
      const lane = keyToLane.get(lk);
      if (lane === undefined) return;
      setPressedLane((p) => (p === lane ? null : p));
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown as EventListener);
      window.removeEventListener("keyup", onKeyUp as EventListener);
    };
  }, [
    beginPlay,
    keyToLane,
    startFromCold,
    started,
    startTypingNote,
    stopTypingNote,
    tryHitKey,
  ]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible")
        void audioRef.current?.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFs);
    onFs();
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const next = isFullscreen ? BRICK_BODY_PCT_FULLSCREEN : BRICK_BODY_PCT_NORMAL;
    const prev = brickBodyPctRef.current;
    brickBodyPctRef.current = next;
    longBrickBodyPctRef.current = next * LONG_BRICK_MULT;
    setBrickBodyPct(next);

    const tiles = tilesRef.current;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i]!;
      const h = t.hPct ?? prev;
      const wasLong = h > prev;
      tiles[i] = { ...t, hPct: wasLong ? next * LONG_BRICK_MULT : next };
    }
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const el = rootRef.current ?? document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
      masterGainRef.current = null;
      compressorRef.current = null;
    };
  }, []);

  const tiles = tilesRef.current;

  return (
    <div
      ref={rootRef}
      className={[
        "min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100",
        isFullscreen ? "p-0" : "px-3 py-8 sm:px-4 sm:py-10",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto w-full",
          isFullscreen ? "max-w-none" : "max-w-2xl",
        ].join(" ")}
      >
        {!isFullscreen ? (
          <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            ← Home
          </Link>
          </div>
        ) : null}

        {!isFullscreen ? (
          <div className="fixed right-0 top-0 z-[90] w-[min(400px,100vw)]">
            <div className="flex max-h-[min(85dvh,720px)] w-full flex-col overflow-y-auto rounded-bl-2xl border border-slate-800/80 bg-slate-900/55 px-5 py-4 shadow-lg shadow-black/30 backdrop-blur">
              <div className="flex w-full flex-col items-end">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {accountName}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                  Score
                </div>
                <div className="mt-1 text-3xl font-semibold tabular-nums leading-none text-white">
                  {score}
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">
                  Best
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums leading-none text-slate-200">
                  {bestScore}
                </div>
              </div>

              <div className="mt-4 w-full border-t border-slate-700/70 pt-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Bảng xếp hạng (Top 10)
                  </span>
                  <button
                    type="button"
                    onClick={() => void refreshLeaderboard()}
                    className="shrink-0 rounded-md border border-slate-700/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800/80"
                  >
                    Làm mới
                  </button>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-slate-500">
                  Điểm chỉ được lưu khi đã{" "}
                  <span className="font-semibold text-slate-400">
                    đăng nhập
                  </span>{" "}
                  và{" "}
                  <span className="font-semibold text-slate-400">
                    hết lượt
                  </span>
                  .
                </p>
                {leaderboardError ? (
                  <p className="mt-2 text-xs text-rose-300/90">{leaderboardError}</p>
                ) : leaderboard.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Chưa có điểm nào trên máy chủ — chơi hết một ván khi đã đăng
                    nhập để điểm xuất hiện.
                  </p>
                ) : (
                  <ul className="mt-3 w-full space-y-1.5">
                    {leaderboard.map((e, idx) => (
                      <li
                        key={e.userId || `${e.username}-${idx}`}
                        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800/60 bg-slate-950/30 px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-slate-100">
                            {idx + 1}. {e.displayName || e.username || "—"}
                          </div>
                          <div className="truncate text-[10px] text-slate-500">
                            @{e.username || "—"}
                          </div>
                        </div>
                        <span className="shrink-0 tabular-nums text-xs font-semibold text-white">
                          {Math.max(0, Math.floor(Number(e.bestScore ?? 0)))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {!isFullscreen ? (
        <header className="mt-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Luyện phím với AI
          </h1>
        </header>
        ) : null}

        {!isFullscreen ? (
        <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3">
          <div className="rounded-xl bg-slate-950/30 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Mẫu có sẵn
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <select
                  value={scriptPreset}
                  onChange={(e) => {
                    const p = e.target.value;
                    setScriptPreset(p);
                    window.localStorage.setItem("pianoScriptPreset", p);
                    const next = allPresets[p];
                    if (next !== undefined) setScriptText(next);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100"
                >
                  {Object.keys(allPresets).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => applyScript(scriptText)}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Áp dụng
                </button>
                <button
                  type="button"
                  onClick={savePreset}
                  className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                >
                  Lưu mẫu
                </button>
              </div>
            </div>

            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={6}
              spellCheck={false}
              className="mt-2 w-full resize-y rounded-lg border border-slate-800 bg-slate-950/40 p-3 font-mono text-xs text-slate-100 outline-none focus:border-sky-500/60"
            />

            {scriptError ? (
              <div className="mt-2 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
                {scriptError}
              </div>
            ) : null}
          </div>
        </div>
        ) : null}

        {!isFullscreen ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {phase === "ready" ? (
            <button
              type="button"
              onClick={() => {
                void (started ? beginPlay() : startFromCold());
              }}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              {started ? "Bắt đầu" : "Bắt đầu + âm thanh"}
            </button>
          ) : null}
          {!started ? (
            <button
              type="button"
              onClick={() => void ensureAudio()}
              className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              Chỉ âm thanh
            </button>
          ) : null}
          {started && phase === "playing" ? (
            <button
              type="button"
              onClick={() => setPhase("paused")}
              className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
            >
              Tạm dừng
            </button>
          ) : null}
          {started && phase === "paused" ? (
            <button
              type="button"
              onClick={resumePlay}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg hover:bg-emerald-400"
            >
              Tiếp tục
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetRun}
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Đặt lại
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          </button>
        </div>
        ) : null}

        {isFullscreen ? (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="fixed right-3 top-3 z-[100] rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur hover:bg-slate-800"
          >
            Thoát
          </button>
        ) : null}

        {!isFullscreen && error ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!isFullscreen ? (
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3 py-3">
            <div className="text-xs text-slate-500">Combo</div>
            <div className="text-xl font-semibold tabular-nums text-amber-300">
              {combo}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3 py-3">
            <div className="text-xs text-slate-500">Lives</div>
            <div className="text-xl font-semibold text-rose-300">
              {"❤".repeat(lives) || "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3 py-3">
            <div className="text-xs text-slate-500">Status</div>
            <div className="text-sm font-semibold capitalize text-slate-200">
              {phase === "playing"
                ? "Go!"
                : phase === "gameover"
                  ? "Over"
                  : phase === "paused"
                    ? "Paused"
                    : "Ready"}
            </div>
          </div>
        </div>
        ) : null}

        <div
          className={[
            isFullscreen
              ? "relative mt-0 h-[100dvh] w-full overflow-hidden rounded-none border-0 shadow-none"
              : "relative mt-8 h-[min(72vh,620px)] w-full overflow-hidden rounded-2xl border shadow-2xl",
            flash === "hit"
              ? "border-emerald-500/60 shadow-emerald-500/10"
              : flash === "miss"
                ? "border-rose-500/50 shadow-rose-500/10"
                : flash === "empty"
                  ? "border-amber-500/40"
                  : "border-slate-700 shadow-black/40",
          ].join(" ")}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />

          <div className={isFullscreen ? "absolute inset-0 z-[1]" : "absolute inset-2 z-[1] sm:inset-3"}>
            <div className="relative h-full w-full">
              {/* Hand split: left A–G | right H–; */}
              <div
                className="pointer-events-none absolute bottom-0 left-0 top-0 z-[4] w-px translate-x-[calc(50%-0.5px)] bg-gradient-to-b from-transparent via-slate-500/50 to-transparent"
                aria-hidden
              />

              <div className="grid h-full min-h-0 gap-1" style={{ gridTemplateColumns: `repeat(${LANE_COUNT}, minmax(0, 1fr))` }}>
                {LANES.map((lane, i) => (
                  <div
                    key={`${lane.label}-${i}`}
                    className={[
                      "relative rounded-lg border border-slate-800/90 bg-slate-900/40",
                      "ring-1",
                      fingerTintClass(lane.fingerType).split(" ")[1] ?? "",
                      wrongLaneSet.has(i)
                        ? "bg-rose-950/35 ring-rose-400/70"
                        : "",
                      pressedLane === i
                        ? "bg-sky-950/50 ring-1 ring-sky-500/40"
                        : "",
                    ].join(" ")}
                    title={lane.finger}
                  >
                    <div
                      className={[
                        "pointer-events-none absolute inset-0 rounded-lg",
                        fingerTintClass(lane.fingerType).split(" ")[0] ?? "",
                        wrongLaneSet.has(i) ? "bg-rose-500/10" : "",
                      ].join(" ")}
                      aria-hidden
                    />
                    {/* lane labels removed */}
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-0 z-[2]">
                {tiles.map((t) => {
                  const wPct = 100 / LANE_COUNT;
                  const showGreen = Boolean(t.armed);
                  return (
                    <div
                      key={t.id}
                      className="absolute px-0.5 will-change-[top]"
                      style={{
                        left: `${t.lane * wPct}%`,
                        width: `${wPct}%`,
                        top: `${t.y}%`,
                        height: `${t.hPct ?? brickBodyPct}%`,
                      }}
                    >
                      <div
                        className={[
                          "flex h-full w-full flex-col items-center justify-center rounded-lg shadow-md",
                          showGreen
                            ? "bg-gradient-to-b from-emerald-200 to-emerald-500 shadow-emerald-500/30 ring-1 ring-emerald-300/70"
                            : "bg-gradient-to-b from-slate-50 to-slate-300 ring-1 ring-white/30",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "select-none font-mono text-base font-bold tabular-nums sm:text-lg",
                            showGreen ? "text-emerald-950" : "text-slate-900",
                          ].join(" ")}
                        >
                          {t.keyChar.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0 z-[25]">
                {hitPulses.map((p) => {
                  const wPct = 100 / LANE_COUNT;
                  return (
                    <div
                      key={p.id}
                      className="absolute px-0.5"
                      style={{
                        left: `${p.lane * wPct}%`,
                        width: `${wPct}%`,
                        top: `${HIT_Y}%`,
                        height: `${brickBodyPct}%`,
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div className="h-full w-full rounded-lg bg-emerald-400/50 shadow-lg shadow-emerald-400/35 ring-1 ring-emerald-200/50" />
                    </div>
                  );
                })}
              </div>

              <div
                className="pointer-events-none absolute left-0 right-0 z-[3] border-t-2 border-sky-400/90 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                style={{ top: `${HIT_Y}%` }}
              />
            </div>
          </div>

          {phase === "gameover" ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/85 backdrop-blur-sm">
              <p className="text-lg font-semibold text-white">Hết lượt</p>
              <p className="text-sm text-slate-400">Điểm cuối: {score}</p>
              <button
                type="button"
                onClick={beginPlay}
                className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
              >
                Chơi lại
              </button>
            </div>
          ) : null}

          {phase === "paused" && started ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/70 backdrop-blur-[2px]">
              <p className="text-sm font-medium text-slate-200">Paused</p>
              <button
                type="button"
                onClick={resumePlay}
                className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Tiếp tục
              </button>
            </div>
          ) : null}
        </div>

        {/* footer instructions removed */}
      </div>
    </div>
  );
}
