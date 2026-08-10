import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, NightOffer } from "@/lib/types";
import { SEASON_TIER_LABELS } from "@/lib/credits";
import NewOfferForm from "./NewOfferForm";

const STATUS_CLASS: Record<NightOffer["status"], string> = {
  open: "bg-emerald-100 text-emerald-800",
  booked: "bg-blue-100 text-blue-800",
  withdrawn: "bg-neutral-100 text-neutral-600",
};

export default async function NightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner/nights");

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();

  if (!hotel) redirect("/owner/hotel/new");

  const { data: offers } = await supabase
    .from("night_offers")
    .select("*")
    .eq("hotel_id", hotel.id)
    .order("start_date", { ascending: true })
    .returns<NightOffer[]>();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Your available nights</h1>

      {hotel.verification_status === "verified" ? (
        <div className="mb-10 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="font-medium mb-4">Offer new nights</h2>
          <NewOfferForm hotelId={hotel.id} />
        </div>
      ) : (
        <p className="mb-10 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Your hotel must be verified before you can offer nights.
        </p>
      )}

      <div className="space-y-3">
        {offers?.length ? (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4"
            >
              <div>
                <p className="font-medium">
                  {offer.start_date} → {offer.end_date} ({offer.nights} nights)
                </p>
                <p className="text-sm text-neutral-500">{SEASON_TIER_LABELS[offer.season_tier]}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLASS[offer.status]}`}>
                {offer.status}
              </span>
            </div>
          ))
        ) : (
          <p className="text-neutral-500 text-sm">No nights offered yet.</p>
        )}
      </div>
    </div>
  );
}
