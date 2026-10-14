import { createClient } from '@/lib/supabase/server';
import { resend, EMAIL_FROM } from '@/lib/resend';
import { acknowledgement } from '@/lib/welcomeEmail.mjs';
import { notFound, redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
const owner = 'ofer.delkom@gmail.com';
async function requireOwner() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email_confirmed_at || user.email?.toLowerCase() !== owner) notFound();
  return user;
}
async function sendTest() {
  'use server';
  await requireOwner();
  if (!process.env.RESEND_API_KEY) redirect('/admin/email-test?result=unconfigured');
  const mail = acknowledgement('hoteltrust', { name: 'Ofer', kind: 'account' });
  let accepted = false;
  try {
    const {data,error} = await resend.emails.send({
      from: EMAIL_FROM, to: owner, replyTo: mail.replyTo,
      subject: '[Connection test] ' + mail.subject, html: mail.html, text: mail.text
    }, {idempotencyKey:'hoteltrust-welcome-owner-test/2026-10-14-en-v1'});
    accepted = !error && Boolean(data?.id);
  } catch {}
  redirect(accepted ? '/admin/email-test?result=accepted' : '/admin/email-test?result=failed');
}
export default async function EmailTest({searchParams}: {searchParams: Promise<{result?:string}>}) {
  await requireOwner();
  const {result} = await searchParams;
  return <main dir="ltr" style={{maxWidth:640,margin:'4rem auto',padding:24}}>
    <h1>Welcome email test — HOTELTRUST</h1>
    <p>This sample email is sent only to the account owner: {owner}</p>
    <p>This checks the email template and delivery service. It does not create a customer or booking.</p>
    {result === 'accepted' && <p role="status">The email provider accepted the message. Please check your inbox to confirm delivery.</p>}
    {result === 'failed' && <p role="alert">The email provider did not accept the message. Please check the connection.</p>}
    {result === 'unconfigured' && <p role="alert">The email service key is missing.</p>}
    <form action={sendTest}><button type="submit">Send test email to account owner</button></form>
  </main>;
}

