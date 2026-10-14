import { createClient } from '@/lib/supabase/server';
import { resend, EMAIL_FROM, ADMIN_EMAIL } from '@/lib/resend';
import { acknowledgement, escapeHtml } from '@/lib/welcomeEmail.mjs';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, {status, headers:{'Cache-Control':'private, no-store'}});
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({error:'Use the website to complete registration.'},403);
  const db = await createClient();
  const {data:{user},error} = await db.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email || !user.email_confirmed_at) return json({error:'Verified sign-in required.'},401);
  // Restrict this notification to new accounts; the provider deduplicates the
  // immutable event for 24 hours, longer than this entire eligibility window.
  const age = Date.now() - Date.parse(user.created_at);
  if (!Number.isFinite(age) || age < 0 || age >= 23*60*60*1000) return json({ok:true,sent:false,reason:'outside_welcome_window'});
  if (!process.env.RESEND_API_KEY) return json({error:'Email service is not configured.'},503);
  const mail = acknowledgement('hoteltrust', {name:String(user.user_metadata?.full_name ?? '').slice(0,120),kind:'account'});
  try {
    const {data,error:sendError} = await resend.emails.send({from:EMAIL_FROM,to:user.email,subject:mail.subject,html:mail.html,text:mail.text,replyTo:mail.replyTo},{idempotencyKey:'hoteltrust-welcome/'+user.id});
    if (sendError || !data?.id) return json({error:'Email could not be accepted for delivery.'},502);
    // Retain the existing operator alert, independently deduplicated.
    await resend.emails.send({from:EMAIL_FROM,to:ADMIN_EMAIL,replyTo:user.email,subject:'HOTELTRUST — New account',html:`<p>A new account joined HOTELTRUST.</p><p>${escapeHtml(String(user.user_metadata?.full_name ?? '').slice(0,120))}<br>${escapeHtml(user.email)}</p>`},{idempotencyKey:'hoteltrust-welcome-admin/'+user.id}).catch(()=>{});
    return json({ok:true,accepted:true});
  } catch { return json({error:'Email could not be accepted for delivery.'},502); }
}
