"use client";

import { createContext, useContext, useMemo, useState } from "react";

type AppStateValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  preferredLanguage: "HI" | "EN";
  setPreferredLanguage: (value: "HI" | "EN") => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<"HI" | "EN">("HI");

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      sidebarCollapsed,
      setSidebarCollapsed,
      preferredLanguage,
      setPreferredLanguage
    }),
    [preferredLanguage, sidebarCollapsed, sidebarOpen]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return value;
}
