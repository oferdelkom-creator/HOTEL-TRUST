import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";
import type { Profile } from "@/lib/types";

export async function POST(request: Request) {
  const { profileId } = await request.json();
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle<Profile>();
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: profile.email,
    subject: "Welcome to Hotel Trust",
    html: renderEmail(
      `<p>Hi ${profile.full_name},</p><p>Welcome to Hotel Trust. Next step: <a href="https://hoteltrust.org/owner/hotel/new">add your hotel</a> and submit it for verification - that's what unlocks the exchange for you.</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
