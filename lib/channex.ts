import 'server-only';

type Resource = 'properties' | 'room_types' | 'rate_plans';
type Item = { id: string; attributes: Record<string, unknown> };
export class ChannexError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
export const isChannexId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function channexConfig(env: Record<string, string | undefined> = process.env) {
  const environment = env.CHANNEX_ENVIRONMENT ?? 'staging';
  if (!['staging', 'production'].includes(environment)) throw new ChannexError('configuration', 'Choose a valid Channex environment.');
  const key = env.CHANNEX_API_KEY?.trim();
  return { environment, key, base: environment === 'production' ? 'https://app.channex.io/api/v1/' : 'https://staging.channex.io/api/v1/' };
}

// Only fixed, read-only catalogue endpoints are available in this first connection.
export async function channexCatalogue(resource: Resource, propertyId?: string, env = process.env, transport: typeof fetch = fetch) {
  const config = channexConfig(env);
  if (!config.key) throw new ChannexError('not_configured', 'Channex API key has not been configured on the server.');
  if (!['properties', 'room_types', 'rate_plans'].includes(resource)) throw new ChannexError('invalid_resource', 'Unsupported catalogue.');
  if (resource !== 'properties' && !isChannexId(propertyId)) throw new ChannexError('invalid_property', 'Choose a Channex property.');
  const items: Item[] = [];
  for (let page = 1; page <= 20; page++) {
    const url = new URL(resource, config.base);
    url.searchParams.set('pagination[page]', String(page));
    url.searchParams.set('pagination[limit]', '100');
    if (propertyId) url.searchParams.set('filter[property_id]', propertyId);
    let response: Response;
    try {
      response = await transport(url, { method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000), headers: { 'user-api-key': config.key, Accept: 'application/json' } });
    } catch { throw new ChannexError('unavailable', 'Channex could not be reached. Please try again.'); }
    if (!response.ok) {
      const code = response.status === 401 || response.status === 403 ? 'access_denied' : response.status === 429 ? 'rate_limited' : 'provider_error';
      throw new ChannexError(code, code === 'access_denied' ? 'Channex rejected this key or its permissions.' : code === 'rate_limited' ? 'Channex rate limit reached. Please wait before retrying.' : 'Channex returned an error. Please try again.');
    }
    let payload: { data?: Item[]; meta?: { total?: number } };
    try { payload = await response.json(); } catch { throw new ChannexError('invalid_response', 'Channex returned an invalid response.'); }
    if (!Array.isArray(payload.data) || payload.data.some(item => !isChannexId(item?.id) || !item.attributes || typeof item.attributes !== 'object' || Array.isArray(item.attributes))) throw new ChannexError('invalid_response', 'Channex returned an invalid catalogue.');
    items.push(...payload.data);
    if (payload.data.length < 100 || (typeof payload.meta?.total === 'number' && items.length >= payload.meta.total)) return items.map(item => ({
      id: item.id,
      title: String(item.attributes.title ?? '').slice(0, 300),
      currency: String(item.attributes.currency ?? '').slice(0, 3),
      city: String(item.attributes.city ?? '').slice(0, 255),
      country: String(item.attributes.country ?? '').slice(0, 2),
    }));
  }
  throw new ChannexError('catalogue_limit', 'Catalogue exceeds the connection test limit. Use a key scoped to fewer properties.');
}
