import { createClient } from "@supabase/supabase-js";

/**
 * Cliente service_role (bypassa RLS). SOLO server-side (webhooks, tareas admin).
 * Nunca exponer la service role key al browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
