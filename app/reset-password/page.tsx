import type { Metadata } from "next";
import { ResetPasswordClient } from "@/components/auth/reset-password-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Reset password | AiFrogi", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ResetPasswordClient token={token} />;
}
