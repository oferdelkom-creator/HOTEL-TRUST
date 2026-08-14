import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayment } from "@/lib/yookassa";

export async function POST(request: Request) {
  const { bookingId } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, guest_id, status, total_amount, listings(title)")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Бронирование не найдено" }, { status: 404 });
  }
  if (booking.guest_id !== user.id) {
    return NextResponse.json({ error: "Это не ваше бронирование" }, { status: 403 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: "Бронирование не ожидает оплаты" }, { status: 409 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const listingTitle =
    (booking as unknown as { listings: { title: string } | null }).listings?.title ?? "бронирование";

  let payment;
  try {
    payment = await createPayment({
      amount: booking.total_amount,
      bookingId: booking.id,
      description: `Оплата бронирования: ${listingTitle}`,
      returnUrl: `${siteUrl}/bookings/${booking.id}`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Не удалось создать платёж" }, { status: 502 });
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
    return NextResponse.json({ error: "Не удалось сохранить платёж" }, { status: 500 });
  }

  return NextResponse.json({ confirmationUrl: payment.confirmation?.confirmation_url });
}
