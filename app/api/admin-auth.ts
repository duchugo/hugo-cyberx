import { NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/app/supabase-config";
import { isAdminEmail } from "@/db/owner";

export type AdminIdentity = { id: string; email: string };

export async function getAdminIdentity(req: NextRequest): Promise<AdminIdentity | null> {
  if (process.env.NODE_ENV === "development") {
    return { id: "local-admin", email: "duc.lanrung@gmail.com" };
  }
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { id?: string; email?: string };
    if (!user.id || !isAdminEmail(user.email || null)) return null;
    return { id: user.id, email: user.email! };
  } catch (error) {
    console.error("Supabase admin verification failed", error);
    return null;
  }
}
