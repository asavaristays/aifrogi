import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterClient } from "@/components/auth/register-client";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Create account | AiFrogi", robots: { index: false, follow: false } };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin/customers" : "/dashboard");
  return <RegisterClient />;
}
