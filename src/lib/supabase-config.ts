export const defaultSupabaseUrl = "https://llbizbhdbrblvrjfvxwx.supabase.co";
export const defaultSupabasePublishableKey = "sb_publishable_oiKygYY9YP1FJxBZcV9Lew_04OLw-0c";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || defaultSupabaseUrl;
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    defaultSupabasePublishableKey
  );
}
