"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewOfferForm({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    // season_tier is intentionally not sent - it defaults to 'regular' and
    // only an admin can change it afterward (see lock_season_tier trigger).
    const { error: insertError } = await supabase.from("night_offers").insert({
      hotel_id: hotelId,
      start_date: startDate,
      end_date: endDate,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.refresh();
    setStartDate("");
    setEndDate("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4 flex-wrap">
      <div>
        <label className="block text-sm font-medium mb-1">From</label>
        <input
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">To</label>
        <input
          required
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 text-white px-5 py-2.5 hover:bg-neutral-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Offer these nights"}
      </button>
      {error && <p className="text-sm text-red-600 basis-full">{error}</p>}
    </form>
  );
}
