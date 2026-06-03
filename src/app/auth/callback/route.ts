import { NextResponse, type NextRequest } from "next/server";
import { createAuthSupabaseClient } from "@/lib/supabase-auth-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createAuthSupabaseClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function getSafeNextPath(next: string | null) {
  if (!next?.startsWith("/") || next.startsWith("//")) {
    return "/account";
  }

  return next;
}
