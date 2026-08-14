import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only use. Bypasses RLS entirely - only
// use this from code that has already independently verified the request
// (e.g. the payment webhook re-checks payment status against the YooKassa
// API itself before writing anything). Never import this in client code.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
