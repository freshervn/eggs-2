"use client";

import { getWerewolfAvatarDisplay } from "@/_lib/werewolf/avatars";
import { roleLabel } from "@/_lib/werewolf/game";
import type { WerewolfPlayerPublic, WerewolfRole } from "@/_lib/werewolf/types";
import WerewolfAvatarImage from "./WerewolfAvatarImage";

const BOARD_SIZE = 16;

interface WerewolfPlayerBoardProps {
  players: WerewolfPlayerPublic[];
  knownRoles: Record<string, WerewolfRole>;
  seerResults: Record<string, WerewolfRole>;
  playerUsername: string;
  selectedTarget?: string;
  onSelectTarget?: (username: string) => void;
  selectableUsernames?: string[];
  canRemoveBots?: boolean;
  onRemoveBot?: (username: string) => void;
}

function shortName(name: string, max = 7) {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default function WerewolfPlayerBoard({
  players,
  knownRoles,
  seerResults,
  playerUsername,
  selectedTarget = "",
  onSelectTarget,
  selectableUsernames = [],
  canRemoveBots = false,
  onRemoveBot,
}: WerewolfPlayerBoardProps) {
  const selectable = new Set(selectableUsernames);
  const slots = Array.from({ length: BOARD_SIZE }, (_, index) => players[index] ?? null);

  return (
    <section className="ms-board" aria-label="Bàn người chơi">
      <header className="ms-board-header">
        <h2>Bàn chơi</h2>
        <span>
          {players.length}/{BOARD_SIZE}
        </span>
      </header>

      <div className="ms-board-grid" role="list">
        {slots.map((player, index) => {
          if (!player) {
            return (
              <div key={`empty-${index}`} className="ms-board-cell is-empty" role="listitem">
                <span className="ms-board-seat">{index + 1}</span>
              </div>
            );
          }

          const isMe = player.username === playerUsername;
          const knownRole = knownRoles[player.username];
          const seerResult = seerResults[player.username];
          const isDead = player.status === "dead";
          const isSelectable = selectable.has(player.username);
          const isSelected = selectedTarget === player.username;
          const roleHint = knownRole
            ? roleLabel(knownRole)
            : seerResult
              ? roleLabel(seerResult)
              : "";
          const avatar = getWerewolfAvatarDisplay(player.avatarId, player.avatarUrl);

          const CellTag = isSelectable ? "button" : "div";

          return (
            <CellTag
              key={player.username}
              type={isSelectable ? "button" : undefined}
              role="listitem"
              className={[
                "ms-board-cell",
                isMe ? "is-me" : "",
                isDead ? "is-dead" : "",
                isSelectable ? "is-selectable" : "",
                isSelected ? "is-selected" : "",
                knownRole ? `has-role-${knownRole}` : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={
                isSelectable && onSelectTarget
                  ? () => onSelectTarget(player.username)
                  : undefined
              }
              aria-pressed={isSelectable ? isSelected : undefined}
              aria-label={`${player.displayName}${isMe ? ", bạn" : ""}${
                player.isHost ? ", chủ phòng" : ""
              }${player.isBot ? ", bot" : ""}${isDead ? ", đã chết" : ""}${
                roleHint ? `, ${roleHint}` : ""
              }`}
            >
              <span className="ms-board-avatar">
                <WerewolfAvatarImage
                  src={avatar.image}
                  alt={avatar.label}
                  size={64}
                  className="ms-board-avatar-img"
                />
              </span>
              <span className="ms-board-name">{shortName(player.displayName)}</span>
              {player.isHost ? <span className="ms-board-host">chủ</span> : null}
              {player.isBot ? <span className="ms-board-bot">bot</span> : null}
              {isMe ? <span className="ms-board-you">bạn</span> : null}
              {roleHint ? <span className="ms-board-role">{shortName(roleHint, 8)}</span> : null}
              {canRemoveBots && player.isBot && onRemoveBot ? (
                <button
                  type="button"
                  className="ms-board-remove"
                  aria-label={`Xóa ${player.displayName}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveBot(player.username);
                  }}
                >
                  ×
                </button>
              ) : null}
              {isDead ? <span className="ms-board-dead">✕</span> : null}
            </CellTag>
          );
        })}
      </div>

      <style jsx>{`
        .ms-board {
          margin-top: 1.25rem;
        }

        .ms-board-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 0.55rem;
        }

        .ms-board-header h2 {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ms-mute);
        }

        .ms-board-header span {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--ms-mute);
          font-variant-numeric: tabular-nums;
        }

        .ms-board-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.45rem;
        }

        .ms-board-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
          min-height: 4.6rem;
          padding: 0.35rem 0.2rem 0.45rem;
          border: 1.5px solid rgba(47, 74, 58, 0.16);
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.55);
          text-align: center;
        }

        .ms-board-cell.is-empty {
          border-style: dashed;
          border-color: rgba(47, 74, 58, 0.14);
          background: rgba(255, 255, 255, 0.2);
        }

        .ms-board-seat {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(90, 104, 94, 0.45);
        }

        .ms-board-cell.is-me {
          border-color: var(--ms-pine);
          box-shadow: inset 0 0 0 1px rgba(47, 74, 58, 0.08);
        }

        .ms-board-cell.is-dead {
          opacity: 0.5;
        }

        .ms-board-cell.is-selectable {
          cursor: pointer;
        }

        .ms-board-cell.is-selected {
          border-color: var(--ms-ember);
          background: rgba(181, 74, 50, 0.12);
          box-shadow: 0 0 0 2px rgba(181, 74, 50, 0.25);
        }

        .ms-board-cell.has-role-werewolf .ms-board-avatar {
          box-shadow: 0 0 0 2px #b54a32;
        }

        .ms-board-cell.has-role-seer .ms-board-avatar {
          box-shadow: 0 0 0 2px #4a6b8a;
        }

        .ms-board-cell.has-role-doctor .ms-board-avatar {
          box-shadow: 0 0 0 2px #2f7a58;
        }

        .ms-board-cell.has-role-villager .ms-board-avatar {
          box-shadow: 0 0 0 2px #4f7a5c;
        }

        .ms-board-avatar {
          display: block;
          overflow: hidden;
          width: 2.1rem;
          height: 2.1rem;
          border-radius: 999px;
          background: rgba(47, 74, 58, 0.12);
        }

        .ms-board-avatar :global(.ms-board-avatar-img) {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ms-board-name {
          max-width: 100%;
          font-size: 0.68rem;
          font-weight: 600;
          line-height: 1.15;
          color: var(--ms-ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ms-board-host,
        .ms-board-you,
        .ms-board-bot {
          position: absolute;
          top: 0.2rem;
          padding: 0.05rem 0.28rem;
          border-radius: 999px;
          font-size: 0.52rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .ms-board-host {
          left: 0.2rem;
          background: rgba(47, 74, 58, 0.12);
          color: var(--ms-pine);
        }

        .ms-board-bot {
          left: 0.2rem;
          background: rgba(181, 74, 50, 0.12);
          color: var(--ms-ember-deep);
        }

        .ms-board-host + .ms-board-bot {
          left: auto;
          right: 0.2rem;
          top: 1.35rem;
        }

        .ms-board-you {
          right: 0.2rem;
          background: var(--ms-pine);
          color: var(--ms-bone);
        }

        .ms-board-remove {
          position: absolute;
          right: 0.15rem;
          bottom: 0.15rem;
          width: 1.2rem;
          height: 1.2rem;
          border: 0;
          border-radius: 999px;
          background: rgba(181, 74, 50, 0.9);
          color: #fff;
          font-size: 0.85rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
        }

        .ms-board-role {
          max-width: 100%;
          font-size: 0.58rem;
          font-weight: 600;
          color: var(--ms-mute);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ms-board-dead {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          border-radius: inherit;
          background: rgba(26, 34, 28, 0.28);
          color: #fff;
          font-size: 1.35rem;
          font-weight: 700;
          pointer-events: none;
        }

        :global(.ms-tone-night) .ms-board-cell:not(.is-empty) {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(232, 235, 228, 0.16);
        }

        :global(.ms-tone-night) .ms-board-cell.is-empty {
          border-color: rgba(232, 235, 228, 0.1);
          background: rgba(255, 255, 255, 0.03);
        }
      `}</style>
    </section>
  );
}
