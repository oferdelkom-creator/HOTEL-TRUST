import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayment } from "@/lib/yookassa";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";

export async function POST(request: Request) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const { bookingId } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: dict.api.notAuthenticated }, { status: 401 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, guest_id, status, total_amount, listings(title)")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: dict.api.bookingNotFound }, { status: 404 });
  }
  if (booking.guest_id !== user.id) {
    return NextResponse.json({ error: dict.api.notYourBooking }, { status: 403 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: dict.api.notAwaitingPayment }, { status: 409 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const listingTitle =
    (booking as unknown as { listings: { title: string } | null }).listings?.title ??
    dict.api.fallbackListingTitle;

  let payment;
  try {
    payment = await createPayment({
      amount: booking.total_amount,
      bookingId: booking.id,
      description: `${dict.api.paymentDescriptionPrefix}: ${listingTitle}`,
      returnUrl: `${siteUrl}/bookings/${booking.id}`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: dict.api.paymentCreateFailed }, { status: 502 });
  }

  const { error: insertError } = await supabase.from("payments").insert({
    booking_id: booking.id,
    provider_payment_id: payment.id,
    amount: booking.total_amount,
    status: "pending",
    confirmation_url: payment.confirmation?.confirmation_url,
    raw_payload: payment,
  });

  if (insertError) {
    console.error(insertError);
    return NextResponse.json({ error: dict.api.paymentSaveFailed }, { status: 500 });
  }

  return NextResponse.json({ confirmationUrl: payment.confirmation?.confirmation_url });
}
