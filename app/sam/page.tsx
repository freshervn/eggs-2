import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { readSession } from "@/_lib/auth/session";
import { getUserByUsername } from "@/_lib/auth/users";
import SamClient from "./sam-client";

export const metadata: Metadata = {
  title: "Sâm",
  description: "Play Sâm using your account.",
};

export default async function SamPage() {
  const session = await readSession();
  if (!session) redirect("/login?next=/sam");

  const user = await getUserByUsername(session.username);
  if (!user) redirect("/login?next=/sam");

  return (
    <div className="min-h-dvh bg-slate-100 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← Trang chủ
        </Link>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Signed in
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {user.displayName} <span className="text-slate-500">(@{user.username})</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            MVP: match vs bot (single-card plays) + save win/loss to your account.
          </p>
        </header>

        <div className="mt-6">
          <SamClient />
        </div>
      </div>
    </div>
  );
}

