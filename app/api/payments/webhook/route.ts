import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPayment } from "@/lib/yookassa";

// YooKassa doesn't sign webhook bodies, so the notification is only a
// "go check" signal - the actual status always comes from re-fetching the
// payment by id from the API, never from this request's payload directly.
export async function POST(request: Request) {
  let body: { object?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const paymentId = body?.object?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "missing payment id" }, { status: 400 });
  }

  const payment = await getPayment(paymentId);
  const bookingId = payment.metadata?.booking_id;
  if (!bookingId) {
    return NextResponse.json({ error: "missing booking id in metadata" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const paymentStatus =
    payment.status === "succeeded" ? "succeeded" : payment.status === "canceled" ? "canceled" : "pending";

  await supabase
    .from("payments")
    .update({ status: paymentStatus, raw_payload: payment })
    .eq("provider_payment_id", paymentId);

  if (payment.status === "succeeded") {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
  } else if (payment.status === "canceled") {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  }

  return NextResponse.json({ ok: true });
}
