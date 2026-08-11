import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, Profile, SwapInterest, SwapRequest } from "@/lib/types";
import { getVerifiedHotelCount } from "@/lib/platformStats";
import { LAUNCH_THRESHOLD } from "@/lib/platformConfig";
import LockedUntilLaunch from "@/components/LockedUntilLaunch";
import RaiseHandButton from "./RaiseHandButton";

type RequestWithHotel = SwapRequest & { hotel: Hotel };
type InterestWithHotel = SwapInterest & { hotel: Hotel };

export default async function ExchangeRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/exchange/${requestId}`);

  const { data: myHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();

  const { data: request } = await supabase
    .from("swap_requests")
    .select("*, hotel:hotels!swap_requests_hotel_id_fkey(*)")
    .eq("id", requestId)
    .maybeSingle<RequestWithHotel>();

  if (!request) notFound();

  const isOwner = myHotel && request.hotel_id === myHotel.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role">>();
  const verifiedCount = await getVerifiedHotelCount(supabase);

  // Owners can always see their own request; everyone else needs the network
  // to hit critical mass first (same "coming soon" gate as the rest of the
  // exchange - browsing/responding to OTHER hotels' requests is what's locked).
  if (verifiedCount < LAUNCH_THRESHOLD && !isOwner && profile?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <LockedUntilLaunch verifiedCount={verifiedCount} what="Direct exchange" />
      </div>
    );
  }

  const { data: interests } = isOwner
    ? await supabase
        .from("swap_interests")
        .select("*, hotel:hotels!swap_interests_interested_hotel_id_fkey(*)")
        .eq("request_id", requestId)
        .returns<InterestWithHotel[]>()
    : { data: null };

  const { data: myInterest } = myHotel
    ? await supabase
        .from("swap_interests")
        .select("*")
        .eq("request_id", requestId)
        .eq("interested_hotel_id", myHotel.id)
        .maybeSingle<SwapInterest>()
    : { data: null };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1">
        {request.hotel.name} wants: {request.wanted_location}
      </h1>
      <p className="text-neutral-500 mb-6">
        {request.hotel.city}, {request.hotel.country} - {request.hotel.stars}★
      </p>
      {request.notes && <p className="text-neutral-700 mb-8">{request.notes}</p>}

      {isOwner ? (
        <div>
          <h2 className="font-medium mb-4">Who&apos;s raised their hand</h2>
          <div className="space-y-3">
            {interests?.length ? (
              interests.map((i) => (
                <a
                  key={i.id}
                  href={`/exchange/${requestId}/chat/${i.interested_hotel_id}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4 hover:border-brand-green"
                >
                  <span>
                    {i.hotel.name} - {i.hotel.city}, {i.hotel.country} ({i.hotel.stars}★)
                  </span>
                  <span className="text-sm text-brand-green underline">Chat</span>
                </a>
              ))
            ) : (
              <p className="text-neutral-500 text-sm">No one yet - check back soon.</p>
            )}
          </div>
        </div>
      ) : myHotel?.verification_status === "verified" ? (
        myInterest ? (
          <a
            href={`/exchange/${requestId}/chat/${request.hotel_id}`}
            className="inline-block rounded-md bg-brand-green text-brand-gold px-5 py-2.5"
          >
            Go to chat
          </a>
        ) : (
          <RaiseHandButton requestId={requestId} hotelId={myHotel.id} />
        )
      ) : (
        <p className="text-neutral-500 text-sm">
          Your hotel needs to be verified before you can respond to requests.
        </p>
      )}
    </div>
  );
}
