import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRub } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";
import PayButton from "./PayButton";

export default async function BookPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/book/${bookingId}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, guest_id, check_in, check_out, nights, guests_count, price_per_night_snapshot, cleaning_fee_snapshot, total_amount, status, listings(title, city)"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.guest_id !== user.id) notFound();

  if (booking.status !== "pending_payment") {
    redirect(`/bookings/${bookingId}`);
  }

  const listing = (booking as unknown as { listings: { title: string; city: string } | null })
    .listings;

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">{dict.bookConfirm.title}</h1>

      <div className="border border-neutral-200 rounded-xl p-5 space-y-3 mb-6">
        <p className="font-medium">{listing?.title}</p>
        <p className="text-sm text-neutral-500">{listing?.city}</p>
        <div className="text-sm text-neutral-600 pt-2 border-t border-neutral-100 space-y-1">
          <div className="flex justify-between">
            <span>{dict.bookConfirm.checkIn}</span>
            <span>{booking.check_in}</span>
          </div>
          <div className="flex justify-between">
            <span>{dict.bookConfirm.checkOut}</span>
            <span>{booking.check_out}</span>
          </div>
          <div className="flex justify-between">
            <span>{dict.bookConfirm.guests}</span>
            <span>{booking.guests_count}</span>
          </div>
          <div className="flex justify-between">
            <span>
              {formatRub(booking.price_per_night_snapshot)} × {booking.nights}{" "}
              {dict.bookConfirm.nightsAbbr}
            </span>
            <span>{formatRub(booking.price_per_night_snapshot * booking.nights)}</span>
          </div>
          {booking.cleaning_fee_snapshot > 0 && (
            <div className="flex justify-between">
              <span>{dict.bookConfirm.cleaning}</span>
              <span>{formatRub(booking.cleaning_fee_snapshot)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-neutral-900 pt-1">
            <span>{dict.bookConfirm.total}</span>
            <span>{formatRub(booking.total_amount)}</span>
          </div>
        </div>
      </div>

      <PayButton bookingId={booking.id} />
    </div>
  );
}
