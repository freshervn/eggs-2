"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SessionSummary = {
  displayName: string;
};

export default function HomeAuthCorner({
  session,
}: {
  session: SessionSummary | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!session) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-end p-4">
        <Link
          href="/login?next=/"
          className="pointer-events-auto rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login?next=/");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div
      ref={menuRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-end p-4"
    >
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex max-w-[min(100vw-2rem,16rem)] items-center gap-2 rounded-full border border-slate-200 bg-white py-2 pl-3 pr-3 text-sm font-medium text-slate-900 shadow-md transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="truncate">{session.displayName}</span>
          <span className="text-slate-500" aria-hidden>
            ▾
          </span>
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <Link
              role="menuitem"
              href="/profile"
              className="block px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Hồ sơ
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
