import { createBrowserClient } from "@supabase/ssr";
import { assertSupabasePublicEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  assertSupabasePublicEnv();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
