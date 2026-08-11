import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, NightOffer } from "@/lib/types";
import { estimateCreditsCost, SEASON_TIER_LABELS } from "@/lib/credits";

type OfferWithHotel = NightOffer & { hotel: Hotel };

export default async function MarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: offers } = await supabase
    .from("night_offers")
    .select("*, hotel:hotels!night_offers_hotel_id_fkey(*)")
    .eq("status", "open")
    .order("start_date", { ascending: true })
    .returns<OfferWithHotel[]>();

  const verifiedOffers = (offers ?? []).filter((o) => o.hotel.verification_status === "verified");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1">Marketplace</h1>
      <p className="text-neutral-500 mb-8">Available nights at other verified member hotels.</p>

      <div className="grid gap-4">
        {verifiedOffers.length ? (
          verifiedOffers.map((offer) => {
            const cost = estimateCreditsCost(offer.hotel.stars, offer.season_tier, offer.nights);
            const isOwn = user && offer.hotel.owner_id === user.id;
            return (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-6 py-5"
              >
                <div>
                  <p className="font-medium">
                    {offer.hotel.name} - {offer.hotel.city}, {offer.hotel.country}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {offer.hotel.stars}★ - {offer.start_date} → {offer.end_date} ({offer.nights} nights) -{" "}
                    {SEASON_TIER_LABELS[offer.season_tier]}
                  </p>
                  {offer.hotel.perks && (
                    <p className="text-sm text-brand-green mt-1">{offer.hotel.perks}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{cost.toFixed(2)} credits</p>
                  {isOwn ? (
                    <span className="text-xs text-neutral-400">Your own hotel</span>
                  ) : (
                    <Link href={`/book/${offer.id}`} className="text-sm underline">
                      Book with credits
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-neutral-500 text-sm">No nights available right now.</p>
        )}
      </div>
    </div>
  );
}
