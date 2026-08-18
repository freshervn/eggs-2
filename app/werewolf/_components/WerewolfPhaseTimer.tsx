"use client";

import { useEffect, useState } from "react";

interface WerewolfPhaseTimerProps {
  phaseEndsAt: number | null;
  onTimeout: () => void;
}

function formatRemain(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function WerewolfPhaseTimer({
  phaseEndsAt,
  onTimeout,
}: WerewolfPhaseTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [firedFor, setFiredFor] = useState<number | null>(null);

  useEffect(() => {
    if (!phaseEndsAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [phaseEndsAt]);

  useEffect(() => {
    if (!phaseEndsAt) return;
    if (now < phaseEndsAt) return;
    if (firedFor === phaseEndsAt) return;
    setFiredFor(phaseEndsAt);
    onTimeout();
  }, [now, phaseEndsAt, firedFor, onTimeout]);

  if (!phaseEndsAt) return null;

  const remain = phaseEndsAt - now;
  const urgent = remain <= 15_000;

  return (
    <p className={`ms-timer ${urgent ? "is-urgent" : ""}`} role="timer">
      Còn {formatRemain(remain)}
      <style jsx>{`
        .ms-timer {
          margin: 0.55rem 0 0;
          display: inline-flex;
          align-items: center;
          min-height: 1.7rem;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          background: rgba(47, 74, 58, 0.1);
          color: var(--ms-pine);
          font-size: 0.78rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
        }

        .ms-timer.is-urgent {
          background: rgba(181, 74, 50, 0.14);
          color: var(--ms-ember-deep);
        }

        :global(.ms-tone-night) .ms-timer {
          background: rgba(232, 235, 228, 0.12);
          color: #d5e0d8;
        }

        :global(.ms-tone-night) .ms-timer.is-urgent {
          background: rgba(181, 74, 50, 0.28);
          color: #f3c4b8;
        }
      `}</style>
    </p>
  );
}
