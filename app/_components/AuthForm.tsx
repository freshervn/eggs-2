"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNextPath = searchParams.get("next") || "/";
  const nextPath = requestedNextPath.startsWith("/")
    ? requestedNextPath
    : "/";
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = useMemo(
    () =>
      mode === "login"
        ? {
            title: "Đăng nhập",
            buttonText: "Đăng nhập",
            endpoint: "/api/auth/login",
            alternateHref: `/register?next=${encodeURIComponent(nextPath)}`,
            alternateLabel: "Chưa có tài khoản? Đăng ký",
          }
        : {
            title: "Đăng ký",
            buttonText: "Tạo tài khoản",
            endpoint: "/api/auth/register",
            alternateHref: `/login?next=${encodeURIComponent(nextPath)}`,
            alternateLabel: "Đã có tài khoản? Đăng nhập",
          },
    [mode, nextPath]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Yêu cầu thất bại.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-slate-900">{config.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Đăng nhập bằng username/password (lưu Firestore + cookie bảo mật).
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Tên hiển thị
              </span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-0 focus:border-slate-500"
                placeholder="VD: Dayton"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Tên đăng nhập
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-0 focus:border-slate-500"
              placeholder="chữ/số, _ hoặc - (không dấu)"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Mật khẩu
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-0 focus:border-slate-500"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder={mode === "login" ? "Nhập mật khẩu" : "Tạo mật khẩu"}
              required
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Đang xử lý..." : config.buttonText}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-900">
            Về trang chủ
          </Link>
          <Link href={config.alternateHref} className="text-slate-700 underline">
            {config.alternateLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
