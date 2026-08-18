"use client";

import { useEffect, useState } from "react";
import type { NinhBinhStop } from "../_data/stops";

export default function PlaceGallery({
  stop,
  onClose,
}: {
  stop: NinhBinhStop;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const photos = stop.gallery;
  const current = photos[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndex((value) => (value + 1) % photos.length);
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) => (value - 1 + photos.length) % photos.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/94 text-white">
      <div
        className="flex items-center justify-between gap-3 px-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{stop.name}</p>
          <p className="text-[11px] text-white/60">
            {index + 1}/{photos.length} · ảnh tư liệu Wikimedia Commons
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full bg-white px-4 text-sm font-semibold text-[#1f3d28]"
        >
          Đóng
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        <button
          type="button"
          onClick={() =>
            setIndex((value) => (value - 1 + photos.length) % photos.length)
          }
          className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl"
          aria-label="Ảnh trước"
        >
          ‹
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={`${stop.name} ${index + 1}`}
          className="max-h-full max-w-full object-contain"
        />
        <button
          type="button"
          onClick={() => setIndex((value) => (value + 1) % photos.length)}
          className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl"
          aria-label="Ảnh sau"
        >
          ›
        </button>
      </div>

      <div
        className="flex gap-2 overflow-x-auto px-4 pt-3"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {photos.map((src, photoIndex) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(photoIndex)}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
              photoIndex === index ? "border-white" : "border-transparent opacity-70"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
