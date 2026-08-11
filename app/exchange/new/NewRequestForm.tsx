"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewRequestForm({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const [wantedLocation, setWantedLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: request, error: insertError } = await supabase
      .from("swap_requests")
      .insert({ hotel_id: hotelId, wanted_location: wantedLocation, notes: notes || null })
      .select()
      .single();

    if (insertError || !request) {
      setError(insertError?.message ?? "Could not post request");
      setLoading(false);
      return;
    }

    router.push(`/exchange/${request.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Where do you want to go?</label>
        <input
          required
          placeholder="e.g. Marrakech, Morocco"
          value={wantedLocation}
          onChange={(e) => setWantedLocation(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          rows={3}
          placeholder="Dates you're flexible on, number of nights, anything else worth mentioning"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand-green text-brand-gold px-5 py-2.5 disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post request"}
      </button>
    </form>
  );
}
