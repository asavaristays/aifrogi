"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function WebsiteBotDeliveryActions({ botName }: { botName: string }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/aifrogi-bot-sw.js").catch(() => undefined);
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: botName, text: `Open ${botName}`, url: window.location.href }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setNotice("Link copied");
  }

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    setNotice("Use your browser menu, then choose Add to Home Screen.");
  }

  return <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/58">
    <button type="button" onClick={share} className="rounded-full border border-white/15 px-3 py-2 hover:border-[#e2c66d] hover:text-[#e2c66d]">Share bot</button>
    <button type="button" onClick={install} className="rounded-full border border-white/15 px-3 py-2 hover:border-[#e2c66d] hover:text-[#e2c66d]">Add to Home Screen</button>
    {notice ? <span className="basis-full text-center text-[11px] text-[#e2c66d]">{notice}</span> : null}
  </div>;
}
