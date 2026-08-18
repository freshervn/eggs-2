export type WerewolfRole = "werewolf" | "villager" | "seer" | "doctor";

export type WerewolfPhase = "lobby" | "night" | "day" | "voting" | "ended";

export type WerewolfWinner = "werewolves" | "villagers";

export type PlayerStatus = "alive" | "dead";

export interface WerewolfPlayer {
  username: string;
  displayName: string;
  avatarId: string;
  /** Compressed data-URL for custom uploads; null for presets. */
  avatarUrl: string | null;
  status: PlayerStatus;
  role: WerewolfRole | null;
  isHost: boolean;
  isBot: boolean;
}

export interface WerewolfRoomSettings {
  /** 0 = wait until all night roles act */
  nightDurationSec: number;
  /** 0 = host manually starts voting */
  dayDurationSec: number;
  /** 0 = wait until everyone votes */
  voteDurationSec: number;
  enableSeer: boolean;
  enableDoctor: boolean;
  /** 0 = auto from player count */
  wolfCount: number;
  revealRolesAtEnd: boolean;
}

export interface WerewolfRoomRecord {
  id: string;
  name: string;
  inviteCode: string;
  hostUsername: string;
  hostDisplayName: string;
  phase: WerewolfPhase;
  dayNumber: number;
  players: WerewolfPlayer[];
  nightActions: Record<string, string>;
  votes: Record<string, string>;
  seerResults: Record<string, WerewolfRole>;
  winner: WerewolfWinner | null;
  lastEvent: string;
  protectedUsername: string | null;
  settings: WerewolfRoomSettings;
  /** Epoch ms when current timed phase ends; null if unlimited */
  phaseEndsAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface WerewolfPlayerPublic {
  username: string;
  displayName: string;
  avatarId: string;
  avatarUrl: string | null;
  status: PlayerStatus;
  isHost: boolean;
  isBot: boolean;
}

export interface WerewolfRoomView {
  id: string;
  name: string;
  inviteCode: string;
  hostUsername: string;
  hostDisplayName: string;
  phase: WerewolfPhase;
  dayNumber: number;
  players: WerewolfPlayerPublic[];
  myRole: WerewolfRole | null;
  knownRoles: Record<string, WerewolfRole>;
  seerResults: Record<string, WerewolfRole>;
  nightActions: Record<string, string>;
  votes: Record<string, string>;
  winner: WerewolfWinner | null;
  lastEvent: string;
  protectedUsername: string | null;
  settings: WerewolfRoomSettings;
  phaseEndsAt: number | null;
  pendingNightActors: string[];
  pendingVoters: string[];
  canStart: boolean;
  createdAt: number;
  updatedAt: number;
}
