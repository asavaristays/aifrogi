"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      aria-label="Logout from AiFrogi admin panel"
      disabled={loggingOut}
      onClick={logout}
      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[#e2c66d]/45 bg-[#8a6a16] px-4 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(138,106,22,0.28)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
    >
      {loggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}
