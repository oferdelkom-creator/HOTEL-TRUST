const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const mod = { exports: {} };
vm.runInNewContext(ts.transpile(fs.readFileSync('lib/channex.ts', 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), { exports: mod.exports, require: n => { if (n !== 'server-only') throw Error(n); return {}; }, process: { env: {} }, URL, AbortSignal, fetch, Response });
const { channexConfig, channexCatalogue } = mod.exports;
const id = '11111111-1111-4111-8111-111111111111';
const env = { CHANNEX_API_KEY: 'test-only-fixture' };
(async () => {
  assert.equal(channexConfig({}).environment, 'staging');
  assert.throws(() => channexConfig({ CHANNEX_ENVIRONMENT: 'https://untrusted.invalid' }));
  await assert.rejects(() => channexCatalogue('properties', undefined, {}, async () => { throw Error('must not run'); }), e => e.code === 'not_configured');
  await assert.rejects(() => channexCatalogue('room_types', '../other', env), e => e.code === 'invalid_property');
  let requests = 0;
  const items = await channexCatalogue('properties', undefined, env, async (url, options) => {
    requests++;
    assert.equal(url.origin, 'https://staging.channex.io');
    assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
    assert.equal(options.headers['user-api-key'], env.CHANNEX_API_KEY);
    const page = Number(url.searchParams.get('pagination[page]'));
    return Response.json({ data: Array.from({ length: page === 1 ? 100 : 1 }, () => ({ id, attributes: { title: 'Test property', email: 'private@example.invalid' } })) });
  });
  assert.equal(requests, 2); assert.equal(items.length, 101); assert.equal(items[0].email, undefined);
  await channexCatalogue('room_types', id, env, async url => { assert.equal(url.searchParams.get('filter[property_id]'), id); return Response.json({ data: [] }); });
  await assert.rejects(() => channexCatalogue('properties', undefined, env, async () => new Response('private-provider-error', { status: 401 })), e => e.code === 'access_denied' && !e.message.includes('private-provider-error'));
  await assert.rejects(() => channexCatalogue('properties', undefined, env, async () => Response.json({ data: [{ id: 'invalid', attributes: {} }] })), e => e.code === 'invalid_response');
  console.log('Channex checks passed: staging defaults, secret isolation, pagination, filtering, validation and error handling.');
})().catch(e => { console.error(e); process.exit(1); });
