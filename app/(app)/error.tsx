"use client";

import { useEffect } from "react";
import { DataAccessFailure } from "@/components/security/data-access-failure";

export default function ClientDataError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Client workspace data load failed", error); }, [error]);
  return <DataAccessFailure reset={reset} />;
}
