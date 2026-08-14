import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRub } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";
import ReviewForm from "@/components/ReviewForm";

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/bookings/${id}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, guest_id, check_in, check_out, total_amount, status, listings(title, city)")
    .eq("id", id)
    .maybeSingle();

  if (!booking || booking.guest_id !== user.id) notFound();

  const listing = (booking as unknown as { listings: { title: string; city: string } | null })
    .listings;

  const today = new Date().toISOString().slice(0, 10);
  const canReview = booking.status === "confirmed" && booking.check_out <= today;

  let existingReview = null;
  if (canReview) {
    const { data } = await supabase
      .from("reviews")
      .select("rating, comment")
      .eq("booking_id", id)
      .eq("author_role", "guest")
      .maybeSingle();
    existingReview = data;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">{listing?.title}</h1>
      <p className="text-neutral-500 mb-6">{listing?.city}</p>

      <div className="border border-neutral-200 rounded-xl p-6 mb-6">
        <p className="text-sm text-neutral-500 mb-1">{dict.bookingStatusPage.label}</p>
        <p className="text-lg font-semibold mb-4">
          {dict.bookingStatusLabels[booking.status as keyof typeof dict.bookingStatusLabels] ??
            booking.status}
        </p>
        <p className="text-sm text-neutral-600">
          {booking.check_in} — {booking.check_out}
        </p>
        <p className="text-sm text-neutral-600">{formatRub(booking.total_amount)}</p>
      </div>

      {booking.status === "pending_payment" && (
        <div>
          <p className="text-sm text-neutral-500 mb-3">{dict.bookingStatusPage.checkAgainHint}</p>
          <a
            href={`/bookings/${id}`}
            className="inline-block rounded-md bg-brand text-white px-5 py-2.5 font-medium"
          >
            {dict.bookingStatusPage.refresh}
          </a>
        </div>
      )}

      {canReview && (
        <div className="text-left">
          {existingReview ? (
            <div className="border border-neutral-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">{dict.bookingStatusPage.yourReview}</p>
              <p className="text-brand mb-1">{"★".repeat(existingReview.rating)}</p>
              {existingReview.comment && (
                <p className="text-sm text-neutral-600">{existingReview.comment}</p>
              )}
            </div>
          ) : (
            <ReviewForm
              bookingId={booking.id}
              authorRole="guest"
              prompt={dict.bookingStatusPage.ratePrompt}
            />
          )}
        </div>
      )}
    </div>
  );
}
