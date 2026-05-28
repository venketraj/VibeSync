import { createClient } from "@supabase/supabase-js";
import { assertSupabaseServiceEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  assertSupabaseServiceEnv();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
