import Link from "next/link";
import type { Metadata } from "next";
import GitlabSrsBrowser from "./_components/GitlabSrsBrowser";

export const metadata: Metadata = {
  title: "GitLab SRS",
  description: "Browse and read SRS documents from GitLab.",
};

export default function GitlabPage() {
  return (
    <div className="min-h-dvh bg-slate-100 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-2xl px-4">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← Trang chủ
        </Link>

        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            GitLab SRS
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Duyệt và đọc tài liệu SRS từ repo doc iOffice V6.
          </p>
        </header>

        <GitlabSrsBrowser />
      </div>
    </div>
  );
}
