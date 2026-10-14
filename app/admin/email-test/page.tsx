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
  if (!process.env.RESEND_API_KEY) redirect('?result=unconfigured');
  const mail = acknowledgement('hoteltrust', { name: 'עופר', kind: 'account' });
  let accepted = false;
  try {
    const {data,error} = await resend.emails.send({
      from: EMAIL_FROM, to: owner, replyTo: mail.replyTo,
      subject: '[בדיקת חיבור] ' + mail.subject, html: mail.html, text: mail.text
    }, {idempotencyKey:'hoteltrust-welcome-owner-test/2026-10-14'});
    accepted = !error && Boolean(data?.id);
  } catch {}
  redirect(accepted ? '?result=accepted' : '?result=failed');
}
export default async function EmailTest({searchParams}: {searchParams: Promise<{result?:string}>}) {
  await requireOwner();
  const {result} = await searchParams;
  return <main dir="rtl" style={{maxWidth:640,margin:'4rem auto',padding:24}}>
    <h1>בדיקת מייל הצטרפות — HOTELTRUST</h1>
    <p>המייל לדוגמה יישלח לכתובת בעל החשבון בלבד: {owner}</p>
    <p>בדיקה זו בודקת את שירות השליחה והתבנית. אין בה יצירת לקוח או הזמנה.</p>
    {result === 'accepted' && <p role="status">המייל התקבל אצל ספק השליחה. יש לבדוק שהגיע לתיבת הדואר.</p>}
    {result === 'failed' && <p role="alert">ספק השליחה לא אישר את המייל. נדרשת בדיקת החיבור.</p>}
    {result === 'unconfigured' && <p role="alert">חסר מפתח לשירות השליחה.</p>}
    <form action={sendTest}><button type="submit">שליחת מייל בדיקה לבעל החשבון</button></form>
  </main>;
}
