"use client";

import { useEffect, useRef, useState } from "react";
import { Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import {
  CHECKIN_STORAGE_KEY,
  NINH_BINH_STOPS,
  type NinhBinhStop,
  type NinhBinhStopId,
} from "../_data/stops";
import {
  addPhoto,
  compressImageFile,
  dataUrlToBytes,
  deletePhoto,
  downloadBlob,
  listPhotos,
  zipFiles,
  type StoredPhoto,
} from "../_lib/photo-store";
import PlaceGallery from "./PlaceGallery";

const display = Source_Serif_4({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700"],
  variable: "--font-nb-display",
});

const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nb-sans",
});

type CheckinRecord = {
  at: number;
};

type Checkins = Partial<Record<NinhBinhStopId, CheckinRecord>>;
type PhotosByStop = Partial<Record<NinhBinhStopId, StoredPhoto[]>>;

type StatusMessage = {
  tone: "ok" | "warn" | "err";
  text: string;
};

const MAX_PHOTOS_PER_STOP = 12;

function formatTime(at: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(at));
}

function readCheckins(): Checkins {
  try {
    const raw = window.localStorage.getItem(CHECKIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Checkins;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCheckins(next: Checkins) {
  window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(next));
}

export default function NinhBinhCheckin() {
  const [checkins, setCheckins] = useState<Checkins>({});
  const [photos, setPhotos] = useState<PhotosByStop>({});
  const [selectedId, setSelectedId] = useState<NinhBinhStopId>("trang-an");
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [justStamped, setJustStamped] = useState<NinhBinhStopId | null>(null);
  const [viewer, setViewer] = useState<StoredPhoto | null>(null);
  const [placeGalleryOpen, setPlaceGalleryOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCheckins(readCheckins());
    void Promise.all(
      NINH_BINH_STOPS.map(async (stop) => {
        const rows = await listPhotos(stop.id);
        return [stop.id, rows] as const;
      }),
    ).then((entries) => {
      setPhotos(Object.fromEntries(entries) as PhotosByStop);
    });
  }, []);

  const selected = NINH_BINH_STOPS.find((stop) => stop.id === selectedId);
  const selectedPhotos = photos[selectedId] ?? [];
  const allPhotos = NINH_BINH_STOPS.flatMap((stop) =>
    (photos[stop.id] ?? []).map((photo, index) => ({
      photo,
      stop,
      index,
    })),
  );
  const doneCount = NINH_BINH_STOPS.filter((stop) => checkins[stop.id]).length;
  const allDone = doneCount === NINH_BINH_STOPS.length;

  function persist(next: Checkins) {
    setCheckins(next);
    writeCheckins(next);
  }

  function checkIn(stop: NinhBinhStop) {
    persist({ ...checkins, [stop.id]: { at: Date.now() } });
    setJustStamped(stop.id);
    window.setTimeout(() => setJustStamped(null), 1400);
    if (navigator.vibrate) navigator.vibrate(40);
    setStatus({
      tone: "ok",
      text: `Đã check-in ${stop.name}.`,
    });
  }

  function undo(stop: NinhBinhStop) {
    const next = { ...checkins };
    delete next[stop.id];
    persist(next);
    setStatus({ tone: "warn", text: `Đã xóa check-in ${stop.name}.` });
  }

  async function downloadAllPhotos() {
    if (!allPhotos.length) {
      setStatus({ tone: "warn", text: "Chưa có ảnh để tải." });
      return;
    }

    setDownloading(true);
    setStatus(null);
    try {
      if (allPhotos.length === 1) {
        const only = allPhotos[0];
        const bytes = dataUrlToBytes(only.photo.dataUrl);

        downloadBlob(
          new Blob([bytes.buffer as ArrayBuffer], { type: "image/jpeg" }),
          `ninh-binh-${only.stop.id}.jpg`,
        );
      } else {
        const files = allPhotos.map((item) => ({
          name: `${item.stop.order}-${item.stop.id}-${item.index + 1}.jpg`,
          data: dataUrlToBytes(item.photo.dataUrl),
        }));
        downloadBlob(zipFiles(files), "ninh-binh-anh.zip");
      }
      setStatus({
        tone: "ok",
        text:
          allPhotos.length === 1
            ? "Đã tải 1 ảnh."
            : `Đã tải ${allPhotos.length} ảnh (file zip).`,
      });
    } catch {
      setStatus({ tone: "err", text: "Không tải được ảnh. Thử lại." });
    } finally {
      setDownloading(false);
    }
  }

  async function handleFiles(stop: NinhBinhStop, fileList: FileList | null) {
    if (!fileList?.length) return;
    const existing = photos[stop.id] ?? [];
    const room = MAX_PHOTOS_PER_STOP - existing.length;
    if (room <= 0) {
      setStatus({
        tone: "warn",
        text: `Mỗi điểm tối đa ${MAX_PHOTOS_PER_STOP} ảnh.`,
      });
      return;
    }

    const files = [...fileList]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, room);
    if (!files.length) {
      setStatus({ tone: "err", text: "Chọn file ảnh (jpg, png, heic…)." });
      return;
    }

    setUploading(true);
    setStatus(null);
    try {
      const added: StoredPhoto[] = [];
      for (const file of files) {
        const dataUrl = await compressImageFile(file);
        added.push(await addPhoto(stop.id, dataUrl));
      }
      setPhotos((prev) => ({
        ...prev,
        [stop.id]: [...added, ...(prev[stop.id] ?? [])],
      }));
      setStatus({
        tone: "ok",
        text: `Đã thêm ${added.length} ảnh tại ${stop.name}.`,
      });
      if (navigator.vibrate) navigator.vibrate(30);
    } catch {
      setStatus({
        tone: "err",
        text: "Không lưu được ảnh. Thử ảnh nhỏ hơn.",
      });
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (libraryInputRef.current) libraryInputRef.current.value = "";
    }
  }

  async function removePhoto(photo: StoredPhoto) {
    await deletePhoto(photo.id);
    setPhotos((prev) => ({
      ...prev,
      [photo.stopId]: (prev[photo.stopId] ?? []).filter(
        (row) => row.id !== photo.id,
      ),
    }));
    if (viewer?.id === photo.id) setViewer(null);
  }

  if (!selected) return null;

  const record = checkins[selected.id];

  return (
    <div
      className={`${display.variable} ${sans.variable} min-h-dvh bg-[#efe6d4] text-[#243126]`}
      style={{ fontFamily: "var(--font-nb-sans), sans-serif" }}
    >
      <div
        className="mx-auto flex min-h-dvh max-w-lg flex-col"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5d6b58]"
            >
              Eggs
            </Link>
            <h1
              className="truncate text-[28px] font-bold leading-none tracking-wide text-[#1f3d28]"
              style={{ fontFamily: "var(--font-nb-display), serif" }}
            >
              NINH BÌNH
            </h1>
          </div>
          <div className="rounded-2xl border border-[#c9b896] bg-[#f7f1e4] px-3 py-1.5 text-right">
            <p className="text-xl font-bold leading-none tabular-nums text-[#1f3d28]">
              {doneCount}/3
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#6b7a66]">
              dấu
            </p>
          </div>
        </header>

        {allDone ? (
          <p className="mx-4 mt-3 shrink-0 rounded-xl bg-[#1f3d28] px-3 py-2 text-sm font-medium text-[#f4ead8]">
            Đủ 3 dấu. Hành trình đã xong.
          </p>
        ) : null}

        <section className="mx-4 mt-3 shrink-0 overflow-hidden rounded-3xl border border-[#c9b896] bg-[#d8c9a8]">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ninh-binh/map.png"
              alt="Bản đồ lộ trình Ninh Bình"
              className="block h-auto w-full select-none"
              draggable={false}
            />
            <a
              href={selected.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-[3.5%] right-[2.5%] flex h-[20%] w-[23%] min-h-11 touch-manipulation flex-col items-center justify-center rounded-xl bg-[#f7f1e4] px-1.5 text-center"
              aria-label={`Mở Google Maps: ${selected.name}`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7a66]">
                Google Maps
              </span>
              <span className="mt-0.5 max-w-full truncate text-[11px] font-bold text-[#1f3d28]">
                {selected.name}
              </span>
            </a>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-[#efe6d4] px-2 py-2.5">
            {NINH_BINH_STOPS.map((stop) => {
              const done = Boolean(checkins[stop.id]);
              const active = selectedId === stop.id;
              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(stop.id);
                    setStatus(null);
                    setPlaceGalleryOpen(true);
                  }}
                  className="flex touch-manipulation flex-col items-center gap-1"
                  aria-label={`Chọn ${stop.name}`}
                >
                  <span
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      done
                        ? "border-[#c45c2d] bg-[#c45c2d] text-[#fff6ea]"
                        : active
                          ? "border-[#1f3d28] bg-[#1f3d28] text-[#f7f1e4]"
                          : "border-[#c9b896] bg-[#f7f1e4] text-[#1f3d28]"
                    } ${justStamped === stop.id ? "scale-110" : ""}`}
                  >
                    {done ? (
                      <span className="-rotate-12 text-[9px] font-extrabold uppercase leading-tight">
                        Đã
                        <br />
                        đến
                      </span>
                    ) : (
                      stop.order
                    )}
                  </span>
                  <span className="max-w-full truncate text-[11px] font-semibold text-[#4a5c46]">
                    {stop.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mx-0 mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl border-x border-t border-[#c9b896] bg-[#f7f1e4] sm:mx-4 sm:rounded-3xl sm:border">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#d3c4a6] sm:hidden" />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7a66]">
              Điểm {selected.order} · {selected.shortName}
            </p>
            <h2
              className="text-[26px] font-bold leading-tight text-[#1f3d28]"
              style={{ fontFamily: "var(--font-nb-display), serif" }}
            >
              {selected.name}
            </h2>
            <p className="mt-1 text-sm text-[#4a5c46]">{selected.hint}</p>
            <p className="mt-2 text-sm font-semibold text-[#1f3d28]">
              Thời gian xuất phát {selected.departAt}
            </p>
            <p className="mt-0.5 text-xs text-[#6b7a66]">
              {selected.departNote}
            </p>
            <p className="mt-1 text-xs text-[#6b7a66]">
              {selected.duration} · {selected.ticket}
            </p>

            {record ? (
              <p className="mt-3 rounded-xl bg-[#e5efd8] px-3 py-2 text-sm font-medium text-[#1f3d28]">
                Check-in {formatTime(record.at)}
              </p>
            ) : (
              <p className="mt-3 text-sm text-[#4a5c46]">
                Bấm Check-in khi tới nơi. Có thể thêm ảnh trước hoặc sau.
              </p>
            )}

            {status ? (
              <p
                className={`mt-2 rounded-xl px-3 py-2 text-sm ${
                  status.tone === "ok"
                    ? "bg-[#e5efd8] text-[#1f3d28]"
                    : status.tone === "warn"
                      ? "bg-[#f3e6c8] text-[#5c4a20]"
                      : "bg-[#f3d8d0] text-[#6b2c1d]"
                }`}
              >
                {status.text}
              </p>
            ) : null}

            <div className="mt-3 grid grid-cols-3 gap-2">
              {selectedPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square">
                  <button
                    type="button"
                    onClick={() => setViewer(photo)}
                    className="block h-full w-full overflow-hidden rounded-2xl bg-[#e4d7bf]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.dataUrl}
                      alt={`Ảnh ${selected.name}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removePhoto(photo)}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-xs font-bold text-white"
                    aria-label="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedPhotos.length < MAX_PHOTOS_PER_STOP ? (
                <button
                  type="button"
                  onClick={() => libraryInputRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-square touch-manipulation flex-col items-center justify-center rounded-2xl border border-dashed border-[#b7a888] bg-[#efe6d4] text-[#4a5c46] disabled:opacity-50"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="mt-1 px-1 text-center text-[11px] font-medium">
                    {uploading ? "Đang lưu…" : "Thêm ảnh"}
                  </span>
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="min-h-12 touch-manipulation rounded-full border border-[#1f3d28] px-3 text-sm font-semibold text-[#1f3d28] disabled:opacity-60"
              >
                Chụp ảnh
              </button>
              <button
                type="button"
                onClick={() => libraryInputRef.current?.click()}
                disabled={uploading}
                className="min-h-12 touch-manipulation rounded-full border border-[#c9b896] px-3 text-sm font-semibold text-[#4a5c46] disabled:opacity-60"
              >
                Thư viện
              </button>
              <button
                type="button"
                onClick={() => void downloadAllPhotos()}
                disabled={downloading || allPhotos.length === 0}
                className="col-span-2 min-h-12 touch-manipulation rounded-full border border-[#1f3d28] px-3 text-sm font-semibold text-[#1f3d28] disabled:opacity-40"
              >
                {downloading
                  ? "Đang tải…"
                  : allPhotos.length
                    ? `Tải tất cả ảnh (${allPhotos.length})`
                    : "Tải tất cả ảnh"}
              </button>
              {record ? (
                <button
                  type="button"
                  onClick={() => undo(selected)}
                  className="col-span-2 min-h-11 touch-manipulation rounded-full border border-[#c9b896] px-3 text-sm font-medium text-[#4a5c46]"
                >
                  Xóa dấu này
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => checkIn(selected)}
                  className="col-span-2 min-h-12 touch-manipulation rounded-full bg-[#1f3d28] px-3 text-sm font-semibold text-[#f7f1e4]"
                >
                  Check-in
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleFiles(selected, event.target.files)}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(selected, event.target.files)}
      />

      {viewer ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/92">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewer.dataUrl}
            alt="Ảnh check-in"
            className="min-h-0 flex-1 object-contain"
          />
          <div
            className="flex gap-2 px-4 pt-3"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => setViewer(null)}
              className="min-h-12 flex-1 rounded-full bg-white px-4 text-sm font-semibold text-[#1f3d28]"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => void removePhoto(viewer)}
              className="min-h-12 flex-1 rounded-full bg-[#c45c2d] px-4 text-sm font-semibold text-white"
            >
              Xóa ảnh
            </button>
          </div>
        </div>
      ) : null}

      {placeGalleryOpen && selected ? (
        <PlaceGallery
          stop={selected}
          onClose={() => setPlaceGalleryOpen(false)}
        />
      ) : null}
    </div>
  );
}
