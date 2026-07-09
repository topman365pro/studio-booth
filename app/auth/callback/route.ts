import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/gallery";
  const supabase = await createClient();
  if (code && supabase) await supabase.auth.exchangeCodeForSession(code);
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/gallery";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
