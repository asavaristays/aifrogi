"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, variant = "default" }: { className?: string; variant?: "default" | "sidebar" } = {}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
    router.refresh();
  }

  return (
    <Button
      tone={variant === "sidebar" ? "ghost" : "danger"}
      className={cn(
        variant === "sidebar"
          ? "justify-start border border-white/8 !bg-transparent text-white/62 hover:!bg-white/8 hover:text-white"
          : "justify-center border border-[var(--error)]/20 bg-white text-[var(--error)] hover:bg-[var(--error-soft)]",
        className
      )}
      iconLeft={<Icon name="arrow-right" className="h-4 w-4" />}
      onClick={logout}
    >
      Logout
    </Button>
  );
}
