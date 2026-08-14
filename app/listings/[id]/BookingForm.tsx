"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRub } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function BookingForm({
  listingId,
  pricePerNight,
  cleaningFee,
  maxGuests,
  defaultCheckIn,
  defaultCheckOut,
  defaultGuests,
}: {
  listingId: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: string;
}) {
  const router = useRouter();
  const { dict } = useLocale();
  const [checkIn, setCheckIn] = useState(defaultCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(defaultCheckOut ?? "");
  const [guests, setGuests] = useState(defaultGuests ?? "1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut]
  );
  const total = nights > 0 ? nights * pricePerNight + cleaningFee : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (nights <= 0) {
      setError(dict.bookingForm.invalidDates);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data, error: insertError } = await supabase
      .from("bookings")
      .insert({
        listing_id: listingId,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: Number(guests),
        guest_name: profile?.full_name ?? "",
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? dict.bookingForm.genericError);
      setLoading(false);
      return;
    }

    router.push(`/book/${data.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-neutral-200 rounded-xl p-5 sticky top-6 space-y-3"
    >
      <p className="text-lg font-semibold">
        {formatRub(pricePerNight)} {dict.bookingForm.perNight}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            {dict.bookingForm.checkIn}
          </label>
          <input
            required
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            {dict.bookingForm.checkOut}
          </label>
          <input
            required
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-1">
          {dict.bookingForm.guestsMax(maxGuests)}
        </label>
        <input
          required
          type="number"
          min={1}
          max={maxGuests}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </div>

      {nights > 0 && (
        <div className="text-sm text-neutral-600 space-y-1 pt-2 border-t border-neutral-100">
          <div className="flex justify-between">
            <span>
              {formatRub(pricePerNight)} × {nights} {dict.bookingForm.nightsAbbr}
            </span>
            <span>{formatRub(pricePerNight * nights)}</span>
          </div>
          {cleaningFee > 0 && (
            <div className="flex justify-between">
              <span>{dict.bookingForm.cleaning}</span>
              <span>{formatRub(cleaningFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-neutral-900 pt-1">
            <span>{dict.bookingForm.total}</span>
            <span>{formatRub(total)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand text-white px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {loading ? dict.bookingForm.submitting : dict.bookingForm.submit}
      </button>
    </form>
  );
}
