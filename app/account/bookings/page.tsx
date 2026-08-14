import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRub } from "@/lib/format";
import { BOOKING_STATUS_LABELS } from "@/lib/listingOptions";

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/bookings");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, check_in, check_out, total_amount, status, listings(title, city)")
    .eq("guest_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Мои бронирования</h1>

      {!bookings || bookings.length === 0 ? (
        <p className="text-neutral-500">Пока нет бронирований.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const listing = (b as unknown as { listings: { title: string; city: string } | null })
              .listings;
            return (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="block border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{listing?.title}</p>
                    <p className="text-sm text-neutral-500">
                      {listing?.city} · {b.check_in} — {b.check_out}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {BOOKING_STATUS_LABELS[b.status] ?? b.status}
                    </p>
                    <p className="text-sm text-neutral-500">{formatRub(b.total_amount)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
