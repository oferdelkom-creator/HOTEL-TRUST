import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import type { Hotel, Profile, SwapRequest } from "@/lib/types";

export async function POST(request: Request) {
  const { requestId, interestedHotelId } = await request.json();
  if (!requestId || !interestedHotelId)
    return NextResponse.json({ error: "requestId and interestedHotelId required" }, { status: 400 });

  const supabase = await createClient();

  const { data: swapRequest } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<SwapRequest>();
  if (!swapRequest) return NextResponse.json({ error: "request not found" }, { status: 404 });

  const { data: requestOwnerHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", swapRequest.hotel_id)
    .maybeSingle<Hotel>();
  const { data: interestedHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", interestedHotelId)
    .maybeSingle<Hotel>();
  if (!requestOwnerHotel || !interestedHotel)
    return NextResponse.json({ error: "hotel not found" }, { status: 404 });

  const { data: owner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", requestOwnerHotel.owner_id)
    .maybeSingle<Profile>();
  if (!owner) return NextResponse.json({ error: "owner not found" }, { status: 404 });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: owner.email,
    subject: `${interestedHotel.name} is interested in your exchange request`,
    html: renderEmail(
      `<p>Hi ${owner.full_name},</p><p><strong>${interestedHotel.name}</strong> (${interestedHotel.city}, ${interestedHotel.country}) raised their hand on your request for ${swapRequest.wanted_location}. <a href="https://hoteltrust.org/exchange/${requestId}">Start chatting</a>.</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
