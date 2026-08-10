import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, NightOffer } from "@/lib/types";
import { estimateCreditsCost, SEASON_TIER_LABELS } from "@/lib/credits";
import BookingForm from "./BookingForm";

type OfferWithHotel = NightOffer & { hotel: Hotel };

export default async function BookNightPage({
  params,
}: {
  params: Promise<{ nightId: string }>;
}) {
  const { nightId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/book/${nightId}`);

  const { data: myHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();
  if (!myHotel) redirect("/owner/hotel/new");
  if (myHotel.verification_status !== "verified") {
    redirect("/owner");
  }

  const { data: offer } = await supabase
    .from("night_offers")
    .select("*, hotel:hotels!night_offers_hotel_id_fkey(*)")
    .eq("id", nightId)
    .maybeSingle<OfferWithHotel>();

  if (!offer || offer.status !== "open") notFound();
  if (offer.hotel_id === myHotel.id) redirect("/marketplace");

  const estimatedCost = estimateCreditsCost(offer.hotel.stars, offer.season_tier, offer.nights);

  const { data: balanceRow } = await supabase
    .from("credit_balances")
    .select("balance")
    .eq("hotel_id", myHotel.id)
    .maybeSingle<{ balance: number }>();
  const balance = balanceRow?.balance ?? 0;
  const willGoNegative = balance - estimatedCost < 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1">
        {offer.hotel.name} - {offer.hotel.city}, {offer.hotel.country}
      </h1>
      <p className="text-neutral-500 mb-6">
        {offer.hotel.stars}★ - {offer.start_date} → {offer.end_date} ({offer.nights} nights) -{" "}
        {SEASON_TIER_LABELS[offer.season_tier]}
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-neutral-500">Your current balance</span>
          <span>{balance.toFixed(2)} credits</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-neutral-500">Cost of this stay</span>
          <span>{estimatedCost.toFixed(2)} credits</span>
        </div>
        {willGoNegative && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            This would take your balance negative. A payment hold will be placed on checkout until
            it&apos;s covered by a stay at your hotel.
          </p>
        )}
      </div>

      <BookingForm nightOfferId={offer.id} hostHotelId={offer.hotel_id} requestingHotelId={myHotel.id} />
    </div>
  );
}
