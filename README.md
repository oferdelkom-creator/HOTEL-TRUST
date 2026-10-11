# HOTELTRUST — hotel operations and guest communication

Preparation release on the existing Vercel FIXFIX/hotel-trust and Supabase HOTEL TRUST projects. Existing exchange records are preserved. No live OTA adapter, outbound delivery, scheduler, AI generation or payments are activated.

## Available now

- /owner: private hotel workspace; /admin: platform admin with hotel selector and authority review; /demo: fictional interactive demo reset on reload.
- Room types, physical rooms, characteristics, allocations per reservation and logged reassignment.
- Reservations, guest stages, conversations, historical messages and internal drafts. Drafts never send.
- Approved knowledge scoped to hotel, room type, room or reservation. Expired facts are excluded. Content is displayed verbatim, not generated or translated.
- Team questions linked to conversations/reservations, staff answers, status and optional validity.
- Reviews with original score scale, normalised averages and staff-assigned themes. AI analysis awaits connection.
- CSV/JSON imports with validation, preview, reference checking and atomic 1–500-row batches. Existing references are skipped, never overwritten. Import room types, rooms, reservations, conversations and then messages in this order.
- Historical response episodes measured from a reply-required guest message to a substantive hotel reply. Follow-ups before a reply count as one episode; acknowledgements, drafts and internal notes are excluded. Replies after the date range are included for episodes begun in range. Boundaries are UTC; day/night uses hotel timezone.
- Planned ten-minute checks, 3/6-month history and reply mode are saved settings only. Live-system response time remains unmeasured.
- Owners/admins grant registered accounts access by account ID. Managers edit configuration; reception edits guest work. No invitation email is sent.
- Database RLS, optimistic version checks, immutable references and database-generated audit history.

## Storage

New ht_records, ht_members and ht_audit tables are additive. Typed JSON records are validated by the application with hotel/kind/reference uniqueness. The private schema holds access and audit helpers; it is not exposed through the Data API. The import RPC is SECURITY INVOKER and uses RLS. October 11 migrations have been applied to the existing project. API credentials must later be held server-side, never in record forms.

## Checks

npm ci
node scripts/verify-support.cjs
node scripts/verify-operations.cjs
npx tsc --noEmit
npm run build

supabase/tests/operations_rls.sql runs transaction-only fixtures and rolls back. It has passed against the real database: owner access, cross-hotel denial, reception restrictions, anonymous users, versions and audit. A restricted Windows host may block native build canonicalisation; verify the same commit with a Vercel build.

## Connection handover

1. Identify the current PMS/channel manager and confirm whether a messaging-only connection can coexist.
2. Obtain provider access and hotel consent. Confirm inbound/outbound messaging, pre-booking coverage, original timestamps, review access and historical backfill.
3. Map provider IDs into external_key and reference fields. Physical room allocation normally requires the PMS.
4. Implement and test server-side provider adapters, authenticated ingestion, idempotency and delivery receipts.
5. Add the unattended scheduler/webhook path. Saved check intervals do not start a job. Measure discovery, drafting, staff wait and actual delivery separately.
6. Add the AI provider after the credential choice and approved hotel facts; verify missing information, current pricing, room promises and escalation before enabling automatic replies.

The interface is English. Guest records and approved content support English, French, Hebrew, German, Spanish and Italian without automatic translation.
