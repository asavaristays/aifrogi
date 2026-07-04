import type { Metadata } from "next";
import { ActivationClient } from "@/components/auth/activation-client";

export const metadata: Metadata = { title: "Activate account | AiFrogi", robots: { index: false, follow: false } };

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <ActivationClient token={token} />;
}
