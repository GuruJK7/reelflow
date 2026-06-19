import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para el browser (usa la anon key pública + RLS). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
