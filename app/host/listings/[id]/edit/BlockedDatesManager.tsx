"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/LocaleProvider";

type BlockedDate = { id: string; date: string };

export default function BlockedDatesManager({
  listingId,
  blockedDates,
}: {
  listingId: string;
  blockedDates: BlockedDate[];
}) {
  const router = useRouter();
  const { dict } = useLocale();
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) return;
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("blocked_dates")
      .insert({ listing_id: listingId, date });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDate("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    const supabase = createClient();
    await supabase.from("blocked_dates").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm">
          {dict.blockedDates.addButton}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {blockedDates.map((d) => (
          <span
            key={d.id}
            className="inline-flex items-center gap-1 bg-neutral-100 rounded-full px-3 py-1 text-sm"
          >
            {d.date}
            <button
              type="button"
              onClick={() => handleRemove(d.id)}
              className="text-neutral-400 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
