import { redirect } from "next/navigation";
import { LoginClient } from "@/components/auth/login-client";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin/customers" : "/dashboard");
  const { returnTo } = await searchParams;
  return <LoginClient returnTo={returnTo} />;
}
