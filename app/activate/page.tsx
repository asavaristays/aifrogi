import { ActivationClient } from "@/components/auth/activation-client";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <ActivationClient token={token} />;
}

