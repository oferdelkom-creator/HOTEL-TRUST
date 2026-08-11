import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import type { Hotel, Profile, SwapRequest } from "@/lib/types";

export async function POST(request: Request) {
  const { requestId, senderHotelId, recipientHotelId, body } = await request.json();
  if (!requestId || !senderHotelId || !recipientHotelId || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: swapRequest } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<SwapRequest>();
  const { data: senderHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", senderHotelId)
    .maybeSingle<Hotel>();
  const { data: recipientHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", recipientHotelId)
    .maybeSingle<Hotel>();
  if (!swapRequest || !senderHotel || !recipientHotel) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", recipientHotel.owner_id)
    .maybeSingle<Profile>();
  if (!owner) return NextResponse.json({ error: "owner not found" }, { status: 404 });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: owner.email,
    subject: `New message from ${senderHotel.name}`,
    html: renderEmail(
      `<p>Hi ${owner.full_name},</p><p><strong>${senderHotel.name}</strong> sent you a message about ${swapRequest.wanted_location}:</p><p style="border-inline-start: 3px solid #1b4332; padding-inline-start: 12px; color: #525252;">${body}</p><p><a href="https://hoteltrust.org/exchange/${requestId}/chat/${senderHotelId}">Reply</a>.</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
