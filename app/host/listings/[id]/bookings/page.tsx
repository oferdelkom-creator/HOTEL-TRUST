import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRub } from "@/lib/format";
import { BOOKING_STATUS_LABELS } from "@/lib/listingOptions";
import ReviewForm from "@/components/ReviewForm";

export default async function ListingBookingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/host/listings/${id}/bookings`);

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, host_id")
    .eq("id", id)
    .maybeSingle();
  if (!listing || listing.host_id !== user.id) notFound();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, guest_name, check_in, check_out, guests_count, total_amount, status")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

  const { data: hostReviews } = await supabase
    .from("reviews")
    .select("booking_id, rating, comment")
    .eq("listing_id", id)
    .eq("author_role", "host");

  const reviewsByBooking = new Map((hostReviews ?? []).map((r) => [r.booking_id, r]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1">Бронирования</h1>
      <p className="text-neutral-500 mb-6">{listing.title}</p>

      {!bookings || bookings.length === 0 ? (
        <p className="text-neutral-500">Пока нет бронирований.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const canReview = b.status === "confirmed" && b.check_out <= today;
            const existingReview = reviewsByBooking.get(b.id);

            return (
              <div key={b.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{b.guest_name || "Гость"}</p>
                    <p className="text-sm text-neutral-500">
                      {b.check_in} — {b.check_out} · {b.guests_count} гостей
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {BOOKING_STATUS_LABELS[b.status] ?? b.status}
                    </p>
                    <p className="text-sm text-neutral-500">{formatRub(b.total_amount)}</p>
                  </div>
                </div>

                {canReview &&
                  (existingReview ? (
                    <div className="border-t border-neutral-100 pt-3">
                      <p className="text-brand text-sm mb-1">{"★".repeat(existingReview.rating)}</p>
                      {existingReview.comment && (
                        <p className="text-sm text-neutral-600">{existingReview.comment}</p>
                      )}
                    </div>
                  ) : (
                    <div className="border-t border-neutral-100 pt-3">
                      <ReviewForm bookingId={b.id} authorRole="host" prompt="Оцените гостя" />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
