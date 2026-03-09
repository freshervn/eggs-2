"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  nextPath?: string;
}

export default function LogoutButton({
  nextPath = "/chat",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-500"
    >
      {isSubmitting ? "Logging out..." : "Logout"}
    </button>
  );
}
