import { createClient } from '@/lib/supabase/server';
import { channexCatalogue, channexConfig, ChannexError, isChannexId } from '@/lib/channex';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function admin() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || !user.email_confirmed_at || user.is_anonymous) return false;
  const { data, error } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return !error && data?.role === 'admin';
}
export async function GET() {
  if (!await admin()) return json({ error: 'Platform admin sign-in required.' }, 403);
  try {
    const config = channexConfig();
    return json({ configured: !!config.key, environment: config.environment, mode: 'catalogue_test', syncEnabled: false });
  } catch { return json({ error: 'Invalid Channex server configuration.' }, 503); }
}
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Use your HOTELTRUST workspace.' }, 403);
  if (!await admin()) return json({ error: 'Platform admin sign-in required.' }, 403);
  let propertyId: string | undefined;
  try {
    const text = await request.text();
    if (text.length > 2000) return json({ error: 'Request too large.' }, 413);
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error();
    if (body.propertyId !== undefined) { if (!isChannexId(body.propertyId)) throw Error(); propertyId = body.propertyId; }
  } catch { return json({ error: 'Invalid property selection.' }, 400); }
  try {
    const properties = await channexCatalogue('properties');
    if (!propertyId) return json({ environment: channexConfig().environment, properties, checkedAt: new Date().toISOString() });
    if (!properties.some(p => p.id === propertyId)) return json({ error: 'Property is not available to this connection.' }, 404);
    const [roomTypes, ratePlans] = await Promise.all([channexCatalogue('room_types', propertyId), channexCatalogue('rate_plans', propertyId)]);
    return json({ environment: channexConfig().environment, properties, roomTypes, ratePlans, checkedAt: new Date().toISOString() });
  } catch (error) {
    return error instanceof ChannexError ? json({ error: error.message, code: error.code }, error.code === 'not_configured' ? 503 : 502) : json({ error: 'Connection test failed.' }, 503);
  }
}
