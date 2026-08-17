import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, NightOffer, Profile } from "@/lib/types";
import { estimateCreditsCost } from "@/lib/credits";
import { getVerifiedHotelCount } from "@/lib/platformStats";
import { LAUNCH_THRESHOLD } from "@/lib/platformConfig";
import LockedUntilLaunch from "@/components/LockedUntilLaunch";
import HotelOfferCard from "@/components/HotelOfferCard";

type OfferWithHotel = NightOffer & { hotel: Hotel };

export default async function MarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const verifiedCount = await getVerifiedHotelCount(supabase);

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<Pick<Profile, "role">>();
    isAdmin = profile?.role === "admin";
  }

  if (verifiedCount < LAUNCH_THRESHOLD && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-1">Marketplace</h1>
        <LockedUntilLaunch verifiedCount={verifiedCount} what="The marketplace" />
      </div>
    );
  }

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
      <p className="text-neutral-500 mb-8">
        Available nights at other verified member hotels. Every price is in credits, calculated from
        the host hotel&apos;s star rating, the season and the number of nights.
      </p>

      <div className="grid gap-4">
        {verifiedOffers.length ? (
          verifiedOffers.map((offer) => {
            const cost = estimateCreditsCost(offer.hotel.stars, offer.season_tier, offer.nights);
            const isOwn = user && offer.hotel.owner_id === user.id;
            return (
              <HotelOfferCard
                key={offer.id}
                hotel={offer.hotel}
                offer={offer}
                cost={cost}
                action={
                  isOwn ? (
                    <span className="text-xs text-neutral-400">Your own hotel</span>
                  ) : (
                    <Link href={`/book/${offer.id}`} className="text-sm underline">
                      Book with credits
                    </Link>
                  )
                }
              />
            );
          })
        ) : (
          <p className="text-neutral-500 text-sm">No nights available right now.</p>
        )}
      </div>
    </div>
  );
}
