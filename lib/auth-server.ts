import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  return await verifySessionToken(token);
}
