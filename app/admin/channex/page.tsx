import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { channexConfig } from '@/lib/channex';
import ChannexConnection from '@/components/ChannexConnection';
export const dynamic = 'force-dynamic';
export default async function ChannexSetup() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || !user.email_confirmed_at || user.is_anonymous) redirect('/login?next=/admin/channex');
  const { data: profile, error } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error || profile?.role !== 'admin') redirect('/owner');
  let config;
  try { config = channexConfig(); } catch { return <main className="ht-wrap ht-section"><h1>Channex configuration needs attention</h1><p>Check the server environment setting.</p></main>; }
  return <main className="ht-wrap ht-section"><Link href="/admin">← Platform admin</Link><h1>Connect HOTELTRUST to Channex</h1><ChannexConnection configured={!!config.key} environment={config.environment}/><section className="ht-card"><h2>First connection</h2><ol><li>Create a free account at <a className="ht-link" href="https://staging.channex.io/sign-up" target="_blank" rel="noopener noreferrer">Channex staging</a>.</li><li>Create an API key in the Channex user profile. Keep it private.</li><li>Add CHANNEX_API_KEY as a sensitive server environment variable on the HOTELTRUST Vercel project. Set CHANNEX_ENVIRONMENT to staging, then redeploy.</li><li>Test the connection above and select a test property.</li><li>Before live synchronisation: map hotel, room and rate IDs, implement inventory updates and booking delivery, complete certification and obtain property owner approval.</li></ol><p>The API key must never be entered in guest chat or hotel record notes.</p></section></main>;
}
