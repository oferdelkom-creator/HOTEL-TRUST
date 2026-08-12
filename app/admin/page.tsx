import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Hotel, Profile } from "@/lib/types";
import VerificationActions from "./VerificationActions";
import SettleBookingButton from "./SettleBookingButton";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (profile?.role !== "admin") redirect("/owner");

  const [{ data: hotels }, { data: bookings }] = await Promise.all([
    supabase.from("hotels").select("*").order("created_at", { ascending: false }).returns<Hotel[]>(),
    supabase
      .from("bookings")
      .select("*, host_hotel:hotels!bookings_host_hotel_id_fkey(name), requesting_hotel:hotels!bookings_requesting_hotel_id_fkey(name)")
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false }),
  ]);

  const pendingHotels = (hotels ?? []).filter((h) => h.verification_status === "pending");
  const decidedHotels = (hotels ?? []).filter((h) => h.verification_status !== "pending");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Admin</h1>
        <p className="text-neutral-500">Ownership verification and booking settlement.</p>
      </div>

      <section>
        <h2 className="font-medium mb-4">Pending verification ({pendingHotels.length})</h2>
        <div className="space-y-3">
          {pendingHotels.length ? (
            pendingHotels.map((hotel) => (
              <div key={hotel.id} className="rounded-lg border border-neutral-200 bg-white px-6 py-5">
                <p className="font-medium">
                  {hotel.name} - {hotel.city}, {hotel.country} - {hotel.stars}★
                </p>
                {hotel.verification_proof_url ? (
                  <a
                    href={hotel.verification_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline text-neutral-600"
                  >
                    View ownership proof
                  </a>
                ) : (
                  <p className="text-sm text-amber-700">No ownership proof submitted yet</p>
                )}
                <VerificationActions hotelId={hotel.id} />
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-sm">Nothing pending.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-4">Active bookings</h2>
        <div className="space-y-3">
          {bookings?.length ? (
            bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-6 py-5">
                <div>
                  <p className="font-medium">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(b as any).requesting_hotel?.name} → {(b as any).host_hotel?.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {b.nights} nights - {b.credits_cost} credits - status: {b.status} - hold: {b.hold_status}
                  </p>
                </div>
                {b.status === "confirmed" && <SettleBookingButton bookingId={b.id} />}
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-sm">No active bookings.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-4">Decided hotels</h2>
        <div className="space-y-2 text-sm text-neutral-600">
          {decidedHotels.map((h) => (
            <div key={h.id} className="flex justify-between border-b border-neutral-100 py-2">
              <span>{h.name}</span>
              <span>{h.verification_status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
