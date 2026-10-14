'use client';
import { useState } from 'react';
type Entry = { id: string; title: string; city?: string; currency?: string };
export default function ChannexConnection({ configured, environment }: { configured: boolean; environment: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Entry[]>([]);
  const [rooms, setRooms] = useState<Entry[]>([]);
  const [rates, setRates] = useState<Entry[]>([]);
  const [property, setProperty] = useState('');
  const [checked, setChecked] = useState('');
  async function test(propertyId?: string) {
    setBusy(true); setError(''); setChecked(''); setRooms([]); setRates([]);
    try {
      const response = await fetch('/api/channex', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(propertyId ? { propertyId } : {}) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Connection test failed.');
      setProperties(data.properties); setRooms(data.roomTypes ?? []); setRates(data.ratePlans ?? []); setChecked(data.checkedAt);
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection test failed.'); }
    finally { setBusy(false); }
  }
  return <section className="ht-card" aria-busy={busy}>
    <h2>Channex connection</h2>
    <p>Environment: <strong>{environment === 'staging' ? 'Free staging / test data' : 'Production'}</strong></p>
    <p>{configured ? 'A server API key is configured. Test it below to verify access.' : 'Waiting for your Channex account and server API key.'}</p>
    <p>This checks accessible properties, room types and rate plans. Automatic synchronisation, bookings and outgoing guest messages are not enabled.</p>
    <button className="ops-button" disabled={!configured || busy} onClick={() => { setProperty(''); void test(); }}>{busy ? 'Checking…' : 'Test connection and load properties'}</button>
    {error && <p role="alert" className="ops-error">{error}</p>}
    {checked && <p role="status">Channex responded successfully at {checked}. {properties.length} properties accessible.</p>}
    {properties.length > 0 && <div className="ops-form"><label>Channex property<select value={property} disabled={busy} onChange={e => { setProperty(e.target.value); setRooms([]); setRates([]); setChecked(''); }}><option value="">Choose a property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.title} {p.city ? `— ${p.city}` : ''}</option>)}</select></label><button className="ops-button" disabled={!property || busy} onClick={() => void test(property)}>Check rooms and rate plans</button></div>}
    {rooms.length > 0 && <><h3>Room types</h3><ul>{rooms.map(r => <li key={r.id}>{r.title} — <code>{r.id}</code></li>)}</ul></>}
    {rates.length > 0 && <><h3>Rate plans</h3><ul>{rates.map(r => <li key={r.id}>{r.title} {r.currency}</li>)}</ul></>}
    {checked && property && !rooms.length && !rates.length && <p>No room types or rate plans were returned for this property.</p>}
    <p>After verification, record the property ID in your hotel workspace under Connections → Channex → Public account / property reference. This reference alone does not activate synchronisation.</p>
  </section>;
}
