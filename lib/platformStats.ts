import type { SupabaseClient } from "@supabase/supabase-js";

export async function getVerifiedHotelCount(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("hotels")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "verified");
  return count ?? 0;
}
