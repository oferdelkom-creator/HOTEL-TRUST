# Гриша

An Airbnb-style short-term rental marketplace built for the Russian market — where Airbnb and
Booking.com don't work due to sanctions. Built with Next.js (App Router, TypeScript, Tailwind) +
Supabase, payments via YooKassa (ЮKassa).

## What's built

- **Guests**: search by city/dates/guests (`/`, `/search`), view a listing (`/listings/[id]`),
  book dates, pay via YooKassa (bank cards including Mir, and SBP), track bookings
  (`/account/bookings`).
- **Hosts**: self-serve, no admin approval gate — any signed-in user can list a place
  (`/host`, `/host/listings/new`, `/host/listings/[id]/edit`), upload photos to Supabase Storage,
  manually block dates, and see bookings per listing (`/host/listings/[id]/bookings`).
- **Pricing/availability is server-side.** `supabase/schema.sql`'s `price_and_validate_booking()`
  trigger prices every booking from the listing's *current* price at insert time (the client never
  sets its own total) and rejects overlapping bookings or host-blocked dates — verified directly
  against the live database (see Verification below).
- **Payments**: `lib/yookassa.ts` + `/api/payments/create` (starts a YooKassa payment, returns the
  redirect URL) + `/api/payments/webhook` (YooKassa doesn't sign webhook bodies, so the webhook
  always re-fetches the real payment status from the API rather than trusting the notification
  payload, then flips the booking to `confirmed`/`cancelled`).
- Auth: `/login` (combined signup/signin/forgot), session via `@supabase/ssr`, route protection in
  `proxy.ts` for `/account/*`, `/host/*`, `/book/*`.
- **Russian/English toggle**: RU/EN switcher in the navbar, backed by a `locale` cookie (default
  `ru`). `lib/i18n/translations.ts` holds the full dictionary; `getLocale()` (`lib/i18n/locale.ts`)
  reads the cookie server-side, `LocaleProvider`/`useLocale()` (`components/LocaleProvider.tsx`)
  exposes it to client components. Covers every page, form, and status label — verified both
  locales render correctly end-to-end.
- **Mutual reviews**: after a stay is over (booking `confirmed` and `check_out` has passed), the
  guest can rate the listing/host and the host can rate the guest — one review per side per
  booking, enforced server-side by `validate_review()` in `supabase/schema.sql` (verified directly
  against the live database: rejects reviewing before the stay ends, rejects the wrong author,
  rejects a duplicate). Guest reviews are public on the listing page (`listing_ratings` view for
  the average); host reviews of a guest are private to that guest.

## Getting started

1. `.env.local` is already wired to a live Supabase project (`grisha-airbnb-russia`,
   `supabase/schema.sql` already applied). To point at a different project instead: create one,
   run `supabase/schema.sql` in its SQL editor, and update `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Fill in `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (Supabase dashboard → Project Settings →
   API → `service_role` key) — needed by the payment webhook, which bypasses RLS to record
   payment/booking status.
3. Fill in `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` from a YooKassa merchant account
   (https://yookassa.ru — requires a registered Russian legal entity; use the sandbox/test shop
   credentials for local development).
4. `npm install && npm run dev` (port 3000).

## Known gaps (deliberate MVP cuts, not forgotten)

- **No automated host payout / split payments.** The platform collects the guest's full payment
  into its own YooKassa account. Paying the host out is manual/outside the app for now — real
  YooKassa split payments (a separate sub-merchant account per host) is a much larger scope with
  real legal overhead, and was explicitly deferred.
- **The payment webhook needs a public HTTPS URL** to actually receive YooKassa's notifications —
  it won't fire against `localhost`. Deploy (e.g. Vercel) and set `NEXT_PUBLIC_SITE_URL` /
  register the webhook URL with YooKassa before testing a real payment end-to-end.
- **No booking cancellation flow** and no dispute resolution beyond direct database access.
- **No messaging** between guest and host.
- **No map integration** on the listing page — city/address are shown as plain text.
- **No availability calendar UI** — hosts block dates one at a time; guests pick dates via plain
  date inputs.
- **No email notifications** (booking confirmations, etc.) — out of scope for this MVP.
