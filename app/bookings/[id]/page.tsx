import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRub } from "@/lib/format";
import { BOOKING_STATUS_LABELS } from "@/lib/listingOptions";

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">{listing?.title}</h1>
      <p className="text-neutral-500 mb-6">{listing?.city}</p>

      <div className="border border-neutral-200 rounded-xl p-6 mb-6">
        <p className="text-sm text-neutral-500 mb-1">Статус бронирования</p>
        <p className="text-lg font-semibold mb-4">
          {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
        </p>
        <p className="text-sm text-neutral-600">
          {booking.check_in} — {booking.check_out}
        </p>
        <p className="text-sm text-neutral-600">{formatRub(booking.total_amount)}</p>
      </div>

      {booking.status === "pending_payment" && (
        <div>
          <p className="text-sm text-neutral-500 mb-3">
            Если вы уже оплатили — статус обновится в течение нескольких секунд.
          </p>
          <a
            href={`/bookings/${id}`}
            className="inline-block rounded-md bg-brand text-white px-5 py-2.5 font-medium"
          >
            Обновить статус
          </a>
        </div>
      )}
    </div>
  );
}
