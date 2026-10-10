# HOTELTRUST — hotel guest support

HOTELTRUST now focuses on guest support, approved hotel information and team request tracking. The previous room exchange programme is retired in the public UI; its data is retained.

## Available in the first platform version

- Existing Supabase account signup/sign-in, hotel profiles and ownership review.
- Multiple hotels in one owner workspace, with hotel-scoped data and database RLS.
- Approved hotel knowledge in English, French, Spanish, Italian, German and Hebrew.
- Internal guest request records, room/reference, category, guest language, staff notes and open/in-progress/resolved status.
- Optimistic version checks for updates.
- A manual preview displays a single matching approved answer verbatim; missing/ambiguous information, service requests, billing and urgent topics require the hotel team.
- Connection requests for PMS, reservation channels, email, WhatsApp and FIXFIX. These do not activate integrations.
- `/demo` is a fictional, browser-tab-only demo with no external writes or messages.

## Deployment

Next.js 16.3, Supabase SSR and existing Vercel project `hotel-trust`. Preserve the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Apply the migration in `supabase/migrations` before publishing. The migration adds support tables; it does not delete earlier hotel/exchange records.

`npm ci`, `node scripts/verify-support.cjs`, `npm run build`.

## Not active yet

AI generation, inbound guest channels, live outgoing replies and automatic job transfer to FIXFIX require separate provider setup, owner authorisation, factual configuration and end-to-end verification. No subscription or service payment is activated by account setup. The interface remains in English; approved answer content and guest-language handoffs support six languages.

Resend notification emails need a separately configured key and verified sending domain; no email delivery claim is made by the support workspace.
