import { NextResponse } from "next/server";
import { resend, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/resend";
import { renderEmail } from "@/lib/emailTemplate";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "name, email, and message required" }, { status: 400 });
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `Contact form: ${name}`,
    html: renderEmail(
      `<p><strong>${name}</strong> (${email}) sent a message:</p><p style="border-inline-start: 3px solid #1b4332; padding-inline-start: 12px; color: #525252;">${message}</p>`
    ),
  });

  return NextResponse.json({ ok: true });
}
