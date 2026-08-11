"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GuestType } from "@/lib/types";

export default function BookingForm({
  nightOfferId,
  hostHotelId,
  requestingHotelId,
}: {
  nightOfferId: string;
  hostHotelId: string;
  requestingHotelId: string;
}) {
  const router = useRouter();
  const [guestType, setGuestType] = useState<GuestType>("owner");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    // credits_cost, stars/season snapshots, and hold_status are all computed
    // server-side by claim_night_offer_and_price() - never trust the client here.
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        night_offer_id: nightOfferId,
        host_hotel_id: hostHotelId,
        requesting_hotel_id: requestingHotelId,
        guest_type: guestType,
        guest_name: guestName,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      setError(bookingError?.message ?? "Could not create booking");
      setLoading(false);
      return;
    }

    const { error: ledgerError } = await supabase.from("credit_ledger").insert({
      hotel_id: requestingHotelId,
      booking_id: booking.id,
      amount: -booking.credits_cost,
      reason: "booking_spent",
    });

    if (ledgerError) {
      setError(ledgerError.message);
      setLoading(false);
      return;
    }

    // Best-effort notification - a failed email shouldn't block the booking itself.
    await fetch("/api/notify/new-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    }).catch(() => {});

    router.push("/owner/bookings");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Who&apos;s staying?</label>
        <select
          value={guestType}
          onChange={(e) => setGuestType(e.target.value as GuestType)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        >
          <option value="owner">Me (the owner)</option>
          <option value="family">Family member</option>
          <option value="employee">Staff member</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Guest name</label>
        <input
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Your account stays financially responsible for this stay regardless of who checks in.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand-green text-brand-gold px-5 py-2.5 disabled:opacity-50"
      >
        {loading ? "Booking..." : "Confirm booking"}
      </button>
    </form>
  );
}
