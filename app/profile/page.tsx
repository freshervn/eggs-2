import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { readSession } from "@/_lib/auth/session";
import { getUserByUsername } from "@/_lib/auth/users";

export const metadata: Metadata = {
  title: "Hồ sơ",
  description: "Thông tin tài khoản của bạn.",
};

function formatDateTime(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ProfilePage() {
  const session = await readSession();
  if (!session) {
    redirect("/login?next=/profile");
  }

  const user = await getUserByUsername(session.username);
  if (!user) {
    redirect("/login?next=/profile");
  }

  return (
    <div className="min-h-dvh bg-slate-100 py-12 text-slate-900">
      <div className="mx-auto max-w-lg px-4">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← Trang chủ
        </Link>

        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <header className="border-b border-slate-100 pb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Tài khoản
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {user.displayName}
            </h1>
            <p className="mt-1 text-lg text-slate-600">@{user.username}</p>
          </header>

          <dl className="mt-8 space-y-6">
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tên hiển thị
              </dt>
              <dd className="mt-1 text-base text-slate-900">{user.displayName}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tên đăng nhập
              </dt>
              <dd className="mt-1 font-mono text-base text-slate-900">
                {user.username}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Account ID
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-700">
                {user.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tham gia từ
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {formatDateTime(user.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Cập nhật gần nhất
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {formatDateTime(user.updatedAt)}
              </dd>
            </div>
          </dl>

          <p className="mt-10 border-t border-slate-100 pt-8 text-sm text-slate-600">
            Trang giới thiệu công khai?{" "}
            <Link
              href="/me"
              className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
            >
              About me
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
