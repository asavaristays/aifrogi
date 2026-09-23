"use client";

import { useEffect } from "react";
import { DataAccessFailure } from "@/components/security/data-access-failure";

export default function AdminDataError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Super Admin data load failed", error); }, [error]);
  return <DataAccessFailure reset={reset} admin />;
}
