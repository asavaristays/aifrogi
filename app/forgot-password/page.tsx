import type { Metadata } from "next";
import { ForgotPasswordClient } from "@/components/auth/forgot-password-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Forgot password | AiFrogi", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
