import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import type { Hotel, Profile } from "@/lib/types";

export async function POST(request: Request) {
  const { hotelId } = await request.json();
  if (!hotelId) return NextResponse.json({ error: "hotelId required" }, { status: 400 });

  const supabase = await createClient();

  // Re-reads the hotel under the caller's own RLS context - only an admin
  // can actually see/set a non-'pending' verification_status, so this
  // naturally fails closed for anyone who isn't authorized to trigger it.
  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", hotelId)
    .maybeSingle<Hotel>();
  if (!hotel || hotel.verification_status === "pending") {
    return NextResponse.json({ error: "hotel not found or not decided" }, { status: 404 });
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", hotel.owner_id)
    .maybeSingle<Profile>();
  if (!owner) return NextResponse.json({ error: "owner not found" }, { status: 404 });

  const verified = hotel.verification_status === "verified";

  await resend.emails.send({
    from: EMAIL_FROM,
    to: owner.email,
    subject: verified ? "You're verified on Hotel Trust" : "Update on your Hotel Trust application",
    html: verified
      ? `<p>Hi ${owner.full_name},</p><p><strong>${hotel.name}</strong> is now verified on Hotel Trust. You can offer nights and browse the exchange at <a href="https://hoteltrust.org/owner">hoteltrust.org/owner</a>.</p>`
      : `<p>Hi ${owner.full_name},</p><p>We weren't able to verify <strong>${hotel.name}</strong> at this time${hotel.verification_note ? `: ${hotel.verification_note}` : "."}</p>`,
  });

  return NextResponse.json({ ok: true });
}
