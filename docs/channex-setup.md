# Channex connection

The first adapter is an admin-only, read-only connection test. It checks the API key by loading properties and allows inspection of room types and rate plans. It does not synchronise inventory or ingest reservations, acknowledge revisions, send guest messages, or activate OTA accounts.

1. Register on https://staging.channex.io and create a private API key from the user profile.
2. On Vercel FIXFIX/hotel-trust, add `CHANNEX_API_KEY` as a sensitive server variable. Never use a NEXT_PUBLIC prefix. Set `CHANNEX_ENVIRONMENT=staging` (also the default). Redeploy.
3. Sign in as platform admin and open `/admin/channex`. Test the connection; inspect a test property's room types and rate plans.
4. Record the correct Channex property ID under the hotel's existing Connections record. The reference alone does not activate sync. Do not store credentials in records.

Only platform admins can inspect the account catalogue. The server uses an allowlist of fixed Channex hosts, blocks redirects, requests no-store responses, validates IDs and limits pagination. Provider error bodies and secrets are never returned to the UI.

Before live operation implement property-scoped mappings, inventory/rate updates, durable booking revision delivery and idempotency, hotel authorisation, certification, and reconciliation tests. Keep staging data separate from real hotel records. The production setting must only be used with production credentials after Channex approval. A successful catalogue test is not PMS certification.

Verification: `node scripts/verify-channex.cjs`, TypeScript and Vercel production build. Missing credentials are reported rather than simulated as a successful connection.

References: https://docs.channex.io/api-v.1-documentation/api-reference and https://docs.channex.io/api-v.1-documentation/pms-certification-tests
