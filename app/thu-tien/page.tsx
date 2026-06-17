"use client";

import QRCode from "@/app/_components/QRCode";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CASSO_SAVE_CONTENT_PREFIX,
  parseSenderFromDescription,
} from "@/_lib/casso";
import {
  subscribeCassoTransactions,
  subscribeMoneyIn,
  type StoredCassoTransaction,
  type StoredMoneyInEntry,
} from "./_subscribeTransactions";

type DisplayEntry = {
  id: string;
  amount: number;
  from: string;
  note: string;
  createdAt: number;
  source: "casso" | "manual";
  when?: string;
};

const PAYMENT_QR_PAYLOAD =
  "00020101021138540010A00000072701240006970422011003359509360208QRIBFTTA53037045802VN63047c29";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function cassoToDisplay(tx: StoredCassoTransaction): DisplayEntry {
  return {
    id: `casso-${tx.id}`,
    amount: tx.amount,
    from: parseSenderFromDescription(tx.description),
    note: tx.description,
    createdAt: tx.createdAt,
    source: "casso",
    when: tx.when,
  };
}

function manualToDisplay(entry: StoredMoneyInEntry): DisplayEntry {
  return {
    id: `manual-${entry.id}`,
    amount: entry.amount,
    from: entry.from,
    note: entry.note,
    createdAt: entry.createdAt,
    source: "manual",
  };
}

export default function ThuTienPage() {
  const [cassoTransactions, setCassoTransactions] = useState<
    StoredCassoTransaction[]
  >([]);
  const [manualEntries, setManualEntries] = useState<StoredMoneyInEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const seenCassoIdsRef = useRef<Set<string>>(new Set());
  const cassoInitializedRef = useRef(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const runCassoSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/casso/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Sync failed");
      setSyncError(null);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    runCassoSync();
    const interval = setInterval(runCassoSync, 60_000);

    const unsubCasso = subscribeCassoTransactions((list) => {
      setCassoTransactions(list);
      setConnected(true);
      setError(null);
    });

    const unsubManual = subscribeMoneyIn((list) => {
      setManualEntries(list);
      setConnected(true);
    });

    return () => {
      clearInterval(interval);
      unsubCasso();
      unsubManual();
    };
  }, []);

  useEffect(() => {
    const seen = seenCassoIdsRef.current;

    if (!cassoInitializedRef.current) {
      for (const tx of cassoTransactions) {
        seen.add(tx.id);
      }
      cassoInitializedRef.current = true;
      return;
    }

    for (const tx of cassoTransactions) {
      if (seen.has(tx.id) || tx.amount <= 0) continue;
      seen.add(tx.id);
      const name = parseSenderFromDescription(tx.description);
      setThankYouMessage(`Cảm ơn anh/chị ${name}`);
    }
  }, [cassoTransactions]);

  useEffect(() => {
    if (!thankYouMessage) return;
    const timeout = setTimeout(() => setThankYouMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [thankYouMessage]);

  const entries = useMemo(() => {
    const merged = [
      ...cassoTransactions.map(cassoToDisplay),
      ...manualEntries.map(manualToDisplay),
    ];
    merged.sort((a, b) => b.createdAt - a.createdAt);
    return merged;
  }, [cassoTransactions, manualEntries]);

  const totals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const entry of entries) {
      if (entry.amount > 0) totalIn += entry.amount;
      else totalOut += Math.abs(entry.amount);
    }
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [entries]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const parsedAmount = Number(amount.replace(/[.,\s]/g, ""));
    if (!from.trim() || !parsedAmount || parsedAmount <= 0) {
      setSubmitError("Nhập đủ tên và số tiền hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/thu-tien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from.trim(),
          amount: parsedAmount,
          direction,
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setFrom("");
      setAmount("");
      setNote("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const hasManualEntries = manualEntries.length > 0;

  const handleDeleteManual = async (manualId: string) => {
    if (!confirm("Xóa giao dịch ghi tay này?")) return;
    setDeletingId(manualId);
    try {
      const res = await fetch(
        `/api/thu-tien?id=${encodeURIComponent(manualId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearManual = async () => {
    if (!confirm("Xóa tất cả giao dịch ghi tay?")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/thu-tien", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200/80">
      {thankYouMessage && (
        <div
          role="status"
          className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
        >
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-800 shadow-lg">
            {thankYouMessage}
          </p>
        </div>
      )}
      <div
        className={`mx-auto w-full max-w-lg px-4 py-10 ${
          isLoggedIn ? "pb-[30rem]" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              {connected && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              )}
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-right">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Vào
                </p>
                <p className="text-sm font-bold text-emerald-600">
                  +{formatAmount(totals.totalIn)}đ
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Ra
                </p>
                <p className="text-sm font-bold text-red-500">
                  -{formatAmount(totals.totalOut)}đ
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Còn
                </p>
                <p
                  className={`text-sm font-bold ${
                    totals.net >= 0 ? "text-slate-900" : "text-red-600"
                  }`}
                >
                  {formatAmount(totals.net)}đ
                </p>
              </div>
            </div>
          </div>
        </div>

        <header className="mt-8">
          <h1 className="text-3xl font-semibold tracking-tight text-center text-slate-900">
            Nuôi em mèo
          </h1>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg shadow-md">
              <Image
                src="/nuoi-meo-cat.jpg"
                alt="Nuôi em"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 384px"
              />
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top: "61%",
                  left: "calc(50.5% + 5px)",
                  width: "24%",
                  height: "24%",
                  transform: "translate(-50%, -50%) scale(1.5) rotate(1deg)",
                }}
              >
                <QRCode
                  value={PAYMENT_QR_PAYLOAD}
                  size={96}
                  level="H"
                  bgColor="transparent"
                  fgColor="#000000"
                  includeMargin={false}
                  className="h-[88%] w-[88%]"
                />
              </div>
            </div>
            <p className="mt-3 text-center text-base font-semibold tracking-wide text-slate-900">
              BUI THANH DAT
            </p>
            <p className="mt-1 text-center text-sm text-slate-600">
              0335950936 MB
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runCassoSync}
              disabled={syncing}
              className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100 disabled:opacity-60"
            >
              {syncing ? "Đang cập nhật…" : "Cập nhật"}
            </button>
          </div>
          {syncError && (
            <p className="mt-2 text-sm text-red-600">
              Không đồng bộ được Casso: {syncError}
            </p>
          )}

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Hướng dẫn cú pháp
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Nội dung chuyển khoản cần có từ{" "}
              <code className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-emerald-700">
                {CASSO_SAVE_CONTENT_PREFIX}
              </code>{" "}
              để được ghi vào sổ quỹ.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Cú pháp gợi ý:
            </p>
            <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm">
              <span className="font-semibold text-emerald-600">
                {CASSO_SAVE_CONTENT_PREFIX}
              </span>{" "}
              <span className="text-amber-600">[Tên]</span>{" "}
              <span className="font-semibold text-violet-600">chuyen</span>{" "}
              <span className="text-amber-600">[ghi chú]</span>
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">Ví dụ:</p>
            <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm">
              <span className="font-semibold text-emerald-600">
                {CASSO_SAVE_CONTENT_PREFIX}
              </span>{" "}
              <span className="text-amber-600">Nguyen Van A</span>{" "}
              <span className="font-semibold text-violet-600">chuyen</span>{" "}
              <span className="text-amber-600">tien an trua</span>
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Tên người gửi lấy phần trước từ{" "}
              <span className="font-mono font-semibold text-violet-600">
                &quot;chuyen&quot;
              </span>
              ,{" "}
              <span className="font-mono font-semibold text-violet-600">
                &quot;chuyển&quot;
              </span>
              ,{" "}
              <span className="font-mono font-semibold text-violet-600">
                &quot;ck&quot;
              </span>{" "}
              hoặc{" "}
              <span className="font-mono font-semibold text-violet-600">
                &quot;transfer&quot;
              </span>
              .
            </p>
          </div>
        </header>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Lịch sử
            </h2>
            {isLoggedIn && hasManualEntries && (
              <button
                type="button"
                onClick={handleClearManual}
                disabled={clearing}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                {clearing ? "Đang xóa…" : "Xóa ghi tay"}
              </button>
            )}
            {isLoggedIn === false && hasManualEntries && (
              <Link
                href="/login?next=/nuoimeo"
                className="text-xs font-medium text-sky-700 underline"
              >
                Đăng nhập để xóa
              </Link>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {!connected && !error && (
            <p className="mt-4 text-sm text-slate-600">Đang kết nối…</p>
          )}

          {connected && entries.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">
              Chưa có giao dịch. Nhấn Cập nhật hoặc ghi tay khi đã đăng nhập.
            </p>
          )}

          <ul className="mt-4 space-y-3">
            {entries.map((entry) => {
              const isIncoming = entry.amount > 0;
              const manualId = entry.source === "manual"
                ? entry.id.replace(/^manual-/, "")
                : null;
              return (
              <li
                key={entry.id}
                className={`rounded-2xl border border-slate-200 border-l-4 bg-white px-4 py-3 shadow-sm ${
                  isIncoming ? "border-l-emerald-500" : "border-l-red-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {entry.from}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          entry.source === "casso"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {entry.source === "casso" ? "Casso" : "Ghi tay"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isIncoming
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {isIncoming ? "Vào" : "Ra"}
                      </span>
                    </div>
                    {entry.note && entry.note !== entry.from && (
                      <p className="mt-0.5 text-sm text-slate-600">
                        {entry.note}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {entry.when ?? formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    {isLoggedIn && manualId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteManual(manualId)}
                        disabled={deletingId === manualId}
                        aria-label="Xóa"
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === manualId ? "…" : "Xóa"}
                      </button>
                    )}
                    <p
                      className={`text-lg font-bold ${
                        isIncoming ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {isIncoming ? "+" : "-"}
                      {formatAmount(Math.abs(entry.amount))}đ
                    </p>
                  </div>
                </div>
              </li>
            );
            })}
          </ul>
        </section>
      </div>

      {isLoggedIn && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-lg space-y-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ghi tay
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("in")}
                className={`rounded-xl border py-2 text-sm font-semibold transition ${
                  direction === "in"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Tiền vào
              </button>
              <button
                type="button"
                onClick={() => setDirection("out")}
                className={`rounded-xl border py-2 text-sm font-semibold transition ${
                  direction === "out"
                    ? "border-red-400 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Tiền ra
              </button>
            </div>

            <div>
              <label
                htmlFor="from"
                className="block text-sm font-medium text-slate-700"
              >
                {direction === "in" ? "Từ ai" : "Cho ai"}
              </label>
              <input
                id="from"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="VD: BUI THANH DAT"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-slate-700"
              >
                Số tiền (đ)
              </label>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 100000"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-slate-700"
              >
                Ghi chú (tuỳ chọn)
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: chuyen tien"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${
                direction === "in"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {submitting ? "Đang lưu…" : "Lưu"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
