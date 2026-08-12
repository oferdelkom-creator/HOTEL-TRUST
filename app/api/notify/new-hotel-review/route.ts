import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import type { Hotel } from "@/lib/types";

export async function POST(request: Request) {
  const { hotelId } = await request.json();
  if (!hotelId) return NextResponse.json({ error: "hotelId required" }, { status: 400 });

  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", hotelId)
    .maybeSingle<Hotel>();
  if (!hotel) return NextResponse.json({ error: "hotel not found" }, { status: 404 });

  const proofLine = hotel.verification_proof_url
    ? `<p><a href="${hotel.verification_proof_url}">Ownership proof</a></p>`
    : `<p>No ownership proof submitted yet.</p>`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    subject: `New hotel pending review: ${hotel.name}`,
    html: renderEmail(
      `<p><strong>${hotel.name}</strong> (${hotel.city}, ${hotel.country}, ${hotel.stars}★) submitted for verification.</p>${proofLine}<p>Review it in <a href="https://hoteltrust.org/admin">the admin panel</a>.</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
