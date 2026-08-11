# Hotel Trust

A credit-based room exchange network for **verified hotel owners only**. Built with Next.js
(App Router, TypeScript, Tailwind) + Supabase.

## Locked MVP scope (2026-08-10)

- **Verification is the trust gate.** Owners submit a link to their OTA listing (Booking.com /
  Google Business) or a hosted ownership document; an admin manually approves/rejects from
  `/admin`. Nothing self-declares its way to "verified".
- **Credits, not 1:1 swaps.** `credits = star_value(stars) * season_multiplier(season_tier) *
  nights`, star value 3★=1.0/4★=1.5/5★=2.0, season low=×0.8/regular=×1.0/high=×1.4. Season tier is
  set by the platform (admin-locked via a DB trigger), never self-declared by the owner, to stop
  owners inflating their own exchange rate.
- **Redemption isn't limited to the owner's own travel.** A booking can be for the owner, a family
  member, or an employee (`guest_type`) - this widens usage without needing more hotels to join.
  The verified owner's account stays financially responsible regardless of who checks in.
- **Credit line, not prepaid currency.** An owner can spend credits before earning them back via
  real stays at their own hotel. If a booking would push their balance negative, `hold_status`
  starts at `pending`. At checkout, an admin calls `settle_booking()`, which credits the host hotel
  for the completed stay and decides `released` vs `captured` based on the requesting hotel's
  balance at that moment. There's no real payment gateway wired up yet (see Known gaps) - `captured`
  just flags that a real charge is owed; actually taking it happens outside this app for now.
- **Tax/legal responsibility stays with each business**, not the platform - each owner reports the
  barter to their own accountant. The platform's only obligation is a clean transaction record
  (the `bookings` + `credit_ledger` tables serve as that receipt).
- **Language: English.** Unlike the other Hebrew-first starters in this workspace, this one targets
  hotel owners internationally from day one (per the planned outreach), so the UI is English/LTR.

## Getting started

1. Create a Supabase project (or use the one already wired into `.env.local`).
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. To make yourself an admin: sign up normally, then in the Supabase table editor set your row in
   `profiles` to `role = 'admin'`. There's no self-serve way to become admin - that's deliberate.
4. `npm install && npm run dev` (default port 3000; see `.claude/launch.json` if running alongside
   sibling starters on other ports).

## What's built

- `supabase/schema.sql`: `profiles` (role: hotel_owner/admin), `hotels` (stars 3-5,
  verification_status locked to admin-only changes via trigger), `night_offers` (date-range blocks
  an owner opens to the pool; booked as a whole block, no partial-range splitting; season_tier
  locked to admin-only changes), `bookings` (credits_cost/stars/season snapshotted and computed
  **server-side** in a trigger - the client never gets to set its own price), `credit_ledger`
  (append-only; an owner can only self-insert the exact negative spend entry matching a booking
  they made, so no one can inflate their own balance), `credit_balances` (view: `sum(amount)` per
  hotel), `settle_booking()` RPC (admin-only checkout settlement).
- Public pages: `/` (landing), `/marketplace` (browse open nights at verified hotels).
- Auth: `/login` (combined signup/signin, creates a `hotel_owner` profile), session via
  `@supabase/ssr`, route protection in `proxy.ts` for `/owner/*`, `/admin/*`, `/book/*`.
- Owner flow: `/owner` (dashboard: balance, verification status), `/owner/hotel/new` + `/edit`
  (profile + ownership proof link), `/owner/nights` (offer/view available nights),
  `/owner/bookings` (bookings you made, bookings at your hotel with a confirm action, full credit
  ledger history).
- Booking flow: `/book/[nightId]` (shows live balance vs. cost, warns if the booking would trigger
  a hold, lets you assign the stay to yourself/family/staff).
- Admin: `/admin` (pending verification queue with approve/reject, active bookings with a "settle
  checkout" action).
- Email notifications via Resend (`lib/resend.ts`, `RESEND_API_KEY` in `.env.local`): verification
  decision (approved/rejected) and new booking alerts, sent from `app/api/notify/*` route handlers
  called client-side after the triggering DB write succeeds (best-effort - a failed email never
  blocks the actual action). **`hoteltrust.org` needs to be verified as a Resend sending domain**
  before these will actually deliver - until then Resend will reject sends from
  `notifications@hoteltrust.org`.

## Assets

`public/logo.png` is the provided brand logo, auto-trimmed. `public/hero-thailand.jpg` is a free-to-use
Unsplash photo (Thailand longtail boat, Unsplash License - free for commercial use, no attribution
required): https://unsplash.com/photos/photo-1704314315344-cd10b9779ce6

## Known gaps (deliberate MVP cuts, not forgotten)

- **No real payment gateway.** `hold_status: 'captured'` just marks that a real charge is owed -
  actually charging the card happens outside the app. This is where a processor with proper
  authorization-hold support would plug in later (the "hold lasts only as long as the stay itself,
  settled at checkout" design was chosen specifically because that fits within standard ~7-30 day
  card-network auth-hold windows).
- **No credit expiration job.** Credits were designed to expire (~18 months) so they don't sit as
  an unsettled liability forever - not implemented yet, would be a scheduled function.
- **No availability calendar UI** - night offers are simple date-range blocks, not a visual
  calendar; no partial-range booking.
- **No file upload for verification** - just a URL field (OTA listing link or a hosted document
  link). No document storage/review UI beyond "open this link".
- **No booking cancellation flow.**
- **One hotel per owner assumed in the UI** (the schema itself allows more; dashboards just fetch
  `.maybeSingle()`).
- **No dispute-resolution UI** for a host that doesn't honor a confirmed booking, beyond admin
  being able to update any booking row directly in the table editor.
