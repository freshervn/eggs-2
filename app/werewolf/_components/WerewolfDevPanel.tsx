"use client";

import { DEV_SCREENS, type DevScreen } from "@/_lib/werewolf/dev-mock";

interface WerewolfDevPanelProps {
  activeScreen: DevScreen | "live";
  onJump: (screen: DevScreen) => void;
  onExitDev: () => void;
}

export default function WerewolfDevPanel({
  activeScreen,
  onJump,
  onExitDev,
}: WerewolfDevPanelProps) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <details className="ms-dev">
      <summary>Dev</summary>
      <div className="ms-dev-body">
        <p>Mock — không gọi API</p>
        <div className="ms-dev-grid">
          {DEV_SCREENS.map((screen) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => onJump(screen.id)}
              className={activeScreen === screen.id ? "is-active" : ""}
            >
              {screen.label}
            </button>
          ))}
        </div>
        {activeScreen !== "live" ? (
          <button type="button" className="ms-dev-exit" onClick={onExitDev}>
            Thoát → live
          </button>
        ) : null}
      </div>
      <style jsx>{`
        .ms-dev {
          position: fixed;
          right: 0.75rem;
          bottom: calc(0.75rem + env(safe-area-inset-bottom));
          z-index: 60;
          max-width: min(18rem, calc(100vw - 1.5rem));
          border: 1.5px dashed #a67c00;
          border-radius: 0.75rem;
          background: rgba(255, 248, 220, 0.96);
          color: #5c4300;
          font-size: 0.7rem;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }

        .ms-dev summary {
          list-style: none;
          cursor: pointer;
          padding: 0.45rem 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          user-select: none;
        }

        .ms-dev summary::-webkit-details-marker {
          display: none;
        }

        .ms-dev[open] summary {
          border-bottom: 1px solid rgba(166, 124, 0, 0.25);
        }

        .ms-dev-body {
          padding: 0.5rem;
          max-height: 45vh;
          overflow-y: auto;
        }

        .ms-dev-body > p {
          margin: 0 0 0.4rem;
          opacity: 0.8;
        }

        .ms-dev-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem;
        }

        .ms-dev-grid button {
          border: 0;
          border-radius: 0.45rem;
          background: #fff;
          color: #5c4300;
          padding: 0.4rem 0.45rem;
          text-align: left;
          font: inherit;
          font-size: 0.65rem;
          font-weight: 600;
          cursor: pointer;
        }

        .ms-dev-grid button.is-active {
          background: #c9872a;
          color: #fff;
        }

        .ms-dev-exit {
          width: 100%;
          margin-top: 0.45rem;
          border: 0;
          border-radius: 0.45rem;
          background: #243029;
          color: #f3efe6;
          padding: 0.45rem;
          font: inherit;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </details>
  );
}
