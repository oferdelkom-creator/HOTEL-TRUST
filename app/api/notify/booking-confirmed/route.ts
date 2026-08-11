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
  if (!hostHotel || !requestingHotel)
    return NextResponse.json({ error: "hotel not found" }, { status: 404 });

  const { data: owner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", requestingHotel.owner_id)
    .maybeSingle<Profile>();
  if (!owner) return NextResponse.json({ error: "owner not found" }, { status: 404 });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: owner.email,
    subject: `Confirmed: your stay at ${hostHotel.name}`,
    html: renderEmail(
      `<p>Hi ${owner.full_name},</p><p><strong>${hostHotel.name}</strong> confirmed your ${booking.nights} night(s) stay (guest: ${booking.guest_name}). See details in your <a href="https://hoteltrust.org/owner/bookings">bookings dashboard</a>.</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
