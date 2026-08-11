import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import type { Booking, Hotel, Profile } from "@/lib/types";

export async function POST(request: Request) {
  const { bookingId } = await request.json();
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle<Booking>();
  if (!booking) return NextResponse.json({ error: "booking not found" }, { status: 404 });

  const { data: hostHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", booking.host_hotel_id)
    .maybeSingle<Hotel>();
  const { data: requestingHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", booking.requesting_hotel_id)
    .maybeSingle<Hotel>();
  if (!hostHotel || !requestingHotel) {
    return NextResponse.json({ error: "hotel not found" }, { status: 404 });
  }

  const { data: hostOwner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", hostHotel.owner_id)
    .maybeSingle<Profile>();
  const { data: requestingOwner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", requestingHotel.owner_id)
    .maybeSingle<Profile>();

  const emails: Promise<unknown>[] = [];

  if (hostOwner) {
    emails.push(
      resend.emails.send({
        from: EMAIL_FROM,
        to: hostOwner.email,
        subject: `Stay completed at ${hostHotel.name}`,
        html: renderEmail(
          `<p>Hi ${hostOwner.full_name},</p><p>The ${booking.nights}-night stay at ${hostHotel.name} is complete and ${booking.credits_cost} credits have been added to your balance.</p>`
        ),
      })
    );
  }

  if (requestingOwner) {
    const captured = booking.hold_status === "captured";
    emails.push(
      resend.emails.send({
        from: EMAIL_FROM,
        to: requestingOwner.email,
        subject: captured
          ? `Payment charged for your stay at ${hostHotel.name}`
          : `Your stay at ${hostHotel.name} is settled`,
        html: renderEmail(
          captured
            ? `<p>Hi ${requestingOwner.full_name},</p><p>Your ${booking.nights}-night stay at ${hostHotel.name} is complete. Your credit balance wasn't fully covered by real stays at your own hotel, so the payment hold on file has been charged.</p>`
            : `<p>Hi ${requestingOwner.full_name},</p><p>Your ${booking.nights}-night stay at ${hostHotel.name} is complete and settled - no charge, your balance covered it.</p>`
        ),
      })
    );
  }

  await Promise.all(emails);

  return NextResponse.json({ ok: true });
}
