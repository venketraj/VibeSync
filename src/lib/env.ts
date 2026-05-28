export function hasSupabasePublicEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function assertSupabasePublicEnv() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

export function assertSupabaseServiceEnv() {
  assertSupabasePublicEnv();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
}
