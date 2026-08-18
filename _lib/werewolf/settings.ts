import type { WerewolfRoomSettings } from "./types";

export const DEFAULT_WEREWOLF_SETTINGS: WerewolfRoomSettings = {
  nightDurationSec: 0,
  dayDurationSec: 180,
  voteDurationSec: 90,
  enableSeer: true,
  enableDoctor: true,
  wolfCount: 0,
  revealRolesAtEnd: true,
};

export const WEREWOLF_DURATION_OPTIONS = [
  { value: 0, label: "Không giới hạn" },
  { value: 30, label: "30 giây" },
  { value: 60, label: "1 phút" },
  { value: 90, label: "1.5 phút" },
  { value: 120, label: "2 phút" },
  { value: 180, label: "3 phút" },
  { value: 300, label: "5 phút" },
] as const;

const clampDuration = (value: unknown, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const sec = Math.round(n);
  if (sec <= 0) return 0;
  return Math.min(600, Math.max(15, sec));
};

const clampWolfCount = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(4, Math.round(n));
};

export function normalizeWerewolfSettings(value: unknown): WerewolfRoomSettings {
  const data =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    nightDurationSec: clampDuration(
      data.nightDurationSec,
      DEFAULT_WEREWOLF_SETTINGS.nightDurationSec
    ),
    dayDurationSec: clampDuration(
      data.dayDurationSec,
      DEFAULT_WEREWOLF_SETTINGS.dayDurationSec
    ),
    voteDurationSec: clampDuration(
      data.voteDurationSec,
      DEFAULT_WEREWOLF_SETTINGS.voteDurationSec
    ),
    enableSeer: data.enableSeer !== false,
    enableDoctor: data.enableDoctor !== false,
    wolfCount: clampWolfCount(data.wolfCount),
    revealRolesAtEnd: data.revealRolesAtEnd !== false,
  };
}

export function serializeWerewolfSettings(settings: WerewolfRoomSettings) {
  return {
    nightDurationSec: settings.nightDurationSec,
    dayDurationSec: settings.dayDurationSec,
    voteDurationSec: settings.voteDurationSec,
    enableSeer: settings.enableSeer,
    enableDoctor: settings.enableDoctor,
    wolfCount: settings.wolfCount,
    revealRolesAtEnd: settings.revealRolesAtEnd,
  };
}

export function getPhaseDurationSec(
  phase: "night" | "day" | "voting",
  settings: WerewolfRoomSettings
) {
  if (phase === "night") return settings.nightDurationSec;
  if (phase === "day") return settings.dayDurationSec;
  return settings.voteDurationSec;
}

export function computePhaseEndsAt(
  phase: "night" | "day" | "voting" | "lobby" | "ended",
  settings: WerewolfRoomSettings,
  now = Date.now()
) {
  if (phase !== "night" && phase !== "day" && phase !== "voting") return null;
  const duration = getPhaseDurationSec(phase, settings);
  if (duration <= 0) return null;
  return now + duration * 1000;
}

export function formatDurationLabel(seconds: number) {
  if (seconds <= 0) return "Không giới hạn";
  if (seconds < 60) return `${seconds} giây`;
  const mins = seconds / 60;
  return Number.isInteger(mins) ? `${mins} phút` : `${mins.toFixed(1)} phút`;
}
