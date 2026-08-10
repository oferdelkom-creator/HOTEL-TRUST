// Mirrors claim_night_offer_and_price() in supabase/schema.sql, which is the
// authoritative, server-side computation. This copy is for client-side price
// previews only - the database trigger always recomputes and overrides it.

export type Stars = 3 | 4 | 5;
export type SeasonTier = "low" | "regular" | "high";

const STAR_VALUE: Record<Stars, number> = { 3: 1.0, 4: 1.5, 5: 2.0 };
const SEASON_MULTIPLIER: Record<SeasonTier, number> = {
  low: 0.8,
  regular: 1.0,
  high: 1.4,
};

export function estimateCreditsCost(stars: Stars, seasonTier: SeasonTier, nights: number): number {
  return Math.round(STAR_VALUE[stars] * SEASON_MULTIPLIER[seasonTier] * nights * 100) / 100;
}

export const SEASON_TIER_LABELS: Record<SeasonTier, string> = {
  low: "Low season",
  regular: "Regular season",
  high: "High season",
};
