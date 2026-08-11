import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
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
  if (!hostHotel) return NextResponse.json({ error: "host hotel not found" }, { status: 404 });

  const { data: owner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", hostHotel.owner_id)
    .maybeSingle<Profile>();
  if (!owner) return NextResponse.json({ error: "owner not found" }, { status: 404 });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: owner.email,
    subject: `New booking at ${hostHotel.name}`,
    html: `<p>Hi ${owner.full_name},</p><p>A member booked <strong>${booking.nights} night(s)</strong> at ${hostHotel.name} for ${booking.credits_cost} credits (guest: ${booking.guest_name}, ${booking.guest_type}). Confirm it from your <a href="https://hoteltrust.org/owner/bookings">bookings dashboard</a>.</p>`,
  });

  return NextResponse.json({ ok: true });
}
