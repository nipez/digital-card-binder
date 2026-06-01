import { createClient } from "@supabase/supabase-js";

const defaultProjectUrl = "https://llbizbhdbrblvrjfvxwx.supabase.co";

export function getAdminSupabaseConfigStatus() {
  return {
    hasUrl: Boolean(getAdminSupabaseUrl()),
    hasAdminKey: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_KEY ||
        process.env.SERVICE_ROLE_KEY
    )
  };
}

export function createAdminSupabaseClient() {
  const url = getAdminSupabaseUrl();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

function getAdminSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || defaultProjectUrl;
}
