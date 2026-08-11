import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, Profile, SwapRequest } from "@/lib/types";
import { getVerifiedHotelCount } from "@/lib/platformStats";
import { LAUNCH_THRESHOLD } from "@/lib/platformConfig";
import LockedUntilLaunch from "@/components/LockedUntilLaunch";

type RequestWithHotel = SwapRequest & { hotel: Hotel };

export default async function ExchangePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exchange");

  const { data: myHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "role">>();

  const verifiedCount = await getVerifiedHotelCount(supabase);

  if (verifiedCount < LAUNCH_THRESHOLD && profile?.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-1">Direct exchange requests</h1>
        <LockedUntilLaunch verifiedCount={verifiedCount} what="Direct exchange" />
      </div>
    );
  }

  const { data: requests } = await supabase
    .from("swap_requests")
    .select("*, hotel:hotels!swap_requests_hotel_id_fkey(*)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .returns<RequestWithHotel[]>();

  const verifiedRequests = (requests ?? []).filter(
    (r) => r.hotel.verification_status === "verified"
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Direct exchange requests</h1>
          <p className="text-neutral-500">
            Members looking for a specific destination - raise your hand and negotiate directly.
          </p>
        </div>
        {myHotel?.verification_status === "verified" && (
          <Link
            href="/exchange/new"
            className="rounded-md bg-brand-green text-brand-gold px-4 py-2 whitespace-nowrap"
          >
            Post a request
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {verifiedRequests.length ? (
          verifiedRequests.map((req) => {
            const isOwn = myHotel && req.hotel_id === myHotel.id;
            return (
              <Link
                key={req.id}
                href={`/exchange/${req.id}`}
                className="block rounded-lg border border-neutral-200 bg-white px-6 py-5 hover:border-brand-green"
              >
                <p className="font-medium">
                  {req.hotel.name} ({req.hotel.city}, {req.hotel.country}) wants:{" "}
                  {req.wanted_location}
                </p>
                {req.notes && <p className="text-sm text-neutral-500 mt-1">{req.notes}</p>}
                {isOwn && <span className="text-xs text-neutral-400">Your request</span>}
              </Link>
            );
          })
        ) : (
          <p className="text-neutral-500 text-sm">No open requests right now.</p>
        )}
      </div>
    </div>
  );
}
