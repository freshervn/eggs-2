"use client";

import {
  formatDurationLabel,
  WEREWOLF_DURATION_OPTIONS,
} from "@/_lib/werewolf/settings";
import type { WerewolfRoomSettings } from "@/_lib/werewolf/types";

interface WerewolfSettingsPanelProps {
  settings: WerewolfRoomSettings;
  editable: boolean;
  playerCount: number;
  onChange?: (next: WerewolfRoomSettings) => void;
  saving?: boolean;
}

export default function WerewolfSettingsPanel({
  settings,
  editable,
  playerCount,
  onChange,
  saving = false,
}: WerewolfSettingsPanelProps) {
  const autoWolves = Math.max(1, Math.floor(playerCount / 4));
  const wolfLabel =
    settings.wolfCount > 0
      ? `${settings.wolfCount} sói`
      : `Tự động (${autoWolves})`;

  const patch = (partial: Partial<WerewolfRoomSettings>) => {
    if (!editable || !onChange) return;
    onChange({ ...settings, ...partial });
  };

  return (
    <section className="ms-settings" aria-label="Cài đặt trò chơi">
      <header className="ms-settings-head">
        <h2>Cài đặt</h2>
        {!editable ? <span>Chỉ chủ phòng chỉnh</span> : null}
        {saving ? <span>Đang lưu…</span> : null}
      </header>

      <div className="ms-settings-grid">
        <label className="ms-settings-field">
          <span>Thời gian đêm</span>
          {editable ? (
            <select
              value={settings.nightDurationSec}
              onChange={(event) =>
                patch({ nightDurationSec: Number(event.target.value) })
              }
            >
              {WEREWOLF_DURATION_OPTIONS.map((option) => (
                <option key={`night-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <strong>{formatDurationLabel(settings.nightDurationSec)}</strong>
          )}
        </label>

        <label className="ms-settings-field">
          <span>Thời gian ngày</span>
          {editable ? (
            <select
              value={settings.dayDurationSec}
              onChange={(event) =>
                patch({ dayDurationSec: Number(event.target.value) })
              }
            >
              {WEREWOLF_DURATION_OPTIONS.map((option) => (
                <option key={`day-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <strong>{formatDurationLabel(settings.dayDurationSec)}</strong>
          )}
        </label>

        <label className="ms-settings-field">
          <span>Thời gian bỏ phiếu</span>
          {editable ? (
            <select
              value={settings.voteDurationSec}
              onChange={(event) =>
                patch({ voteDurationSec: Number(event.target.value) })
              }
            >
              {WEREWOLF_DURATION_OPTIONS.map((option) => (
                <option key={`vote-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <strong>{formatDurationLabel(settings.voteDurationSec)}</strong>
          )}
        </label>

        <label className="ms-settings-field">
          <span>Số Ma Sói</span>
          {editable ? (
            <select
              value={settings.wolfCount}
              onChange={(event) =>
                patch({ wolfCount: Number(event.target.value) })
              }
            >
              <option value={0}>Tự động ({autoWolves})</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          ) : (
            <strong>{wolfLabel}</strong>
          )}
        </label>
      </div>

      <div className="ms-settings-toggles">
        <label className="ms-settings-toggle">
          <input
            type="checkbox"
            checked={settings.enableSeer}
            disabled={!editable}
            onChange={(event) => patch({ enableSeer: event.target.checked })}
          />
          <span>Tiên Tri</span>
        </label>
        <label className="ms-settings-toggle">
          <input
            type="checkbox"
            checked={settings.enableDoctor}
            disabled={!editable}
            onChange={(event) => patch({ enableDoctor: event.target.checked })}
          />
          <span>Bác Sĩ</span>
        </label>
        <label className="ms-settings-toggle">
          <input
            type="checkbox"
            checked={settings.revealRolesAtEnd}
            disabled={!editable}
            onChange={(event) =>
              patch({ revealRolesAtEnd: event.target.checked })
            }
          />
          <span>Lộ vai khi kết thúc</span>
        </label>
      </div>

      <style jsx>{`
        .ms-settings {
          margin: 1rem 0 0.25rem;
          padding: 0.85rem 0.9rem;
          border: 1.5px solid rgba(47, 74, 58, 0.14);
          border-radius: 0.9rem;
          background: rgba(255, 255, 255, 0.45);
        }

        .ms-settings-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.7rem;
        }

        .ms-settings-head h2 {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ms-mute);
        }

        .ms-settings-head span {
          font-size: 0.68rem;
          color: var(--ms-mute);
        }

        .ms-settings-grid {
          display: grid;
          gap: 0.55rem;
        }

        .ms-settings-field {
          display: grid;
          grid-template-columns: 1fr minmax(7.5rem, 42%);
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: var(--ms-ink);
        }

        .ms-settings-field select {
          width: 100%;
          min-height: 2.2rem;
          border: 1.5px solid rgba(47, 74, 58, 0.2);
          border-radius: 0.55rem;
          background: #fff;
          color: var(--ms-ink);
          font: inherit;
          font-size: 0.78rem;
          padding: 0 0.45rem;
        }

        .ms-settings-field strong {
          font-size: 0.78rem;
          font-weight: 600;
          text-align: right;
        }

        .ms-settings-toggles {
          display: grid;
          gap: 0.35rem;
          margin-top: 0.75rem;
        }

        .ms-settings-toggle {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 0.84rem;
          color: var(--ms-ink);
        }

        .ms-settings-toggle input {
          width: 1.05rem;
          height: 1.05rem;
          accent-color: var(--ms-pine);
        }

        :global(.ms-tone-night) .ms-settings {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(232, 235, 228, 0.14);
        }

        :global(.ms-tone-night) .ms-settings-field select {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(232, 235, 228, 0.18);
          color: var(--ms-ink);
        }
      `}</style>
    </section>
  );
}
