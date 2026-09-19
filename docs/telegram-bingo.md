# Telegram Bingo Bot

A 75-ball bingo bot. Solo rounds in a private chat, multiplayer rounds in
a group. Winners collect ⭐ Stars and redeem them for real Telegram gifts.

It lives inside this Next.js app rather than as a separate service: it
reuses the existing Supabase project and deploys with the site, so there
is no second host to pay for or keep alive. Nothing it adds touches the
hotel exchange product — separate tables, separate routes.

## Read this first: what the Bot API can and cannot do

**A bot cannot move Stars into a user's balance.** There is no such
method. What exists is:

| Need | Method | Notes |
| --- | --- | --- |
| Take Stars from a user | `sendInvoice` with `currency: "XTR"` | Disabled here, see below |
| Give a user something of Star value | `sendGift` | Bot buys a gift from **its own** Star balance |
| Give Stars back after a charge | `refundStarPayment` | Only refunds a payment the bot received |

So "winning Stars" works like this: a win credits an append-only ledger,
and `/prizes` spends that balance by having the bot buy a real gift and
send it. **The bot's own Telegram Star balance funds every prize.** Top it
up in BotFather; when it runs dry, `sendGift` fails, the payout is marked
`failed` and the player's Stars are refunded to the ledger automatically.

**Entry is free, deliberately.** Charging for cards while paying out
prizes of monetary value is gambling — barred by Telegram's Stars terms
regardless of local law, and licensed (Malta, UKGC, Curaçao, Ontario,
per-US-state…) where it is legal at all. Free entry plus a real prize is
a sweepstakes instead, which is why `BINGO_PAID_CARDS` defaults to off.
The invoice path is written and gated so enabling it is a reviewable
decision with a paper trail, not a rewrite. Turning it on is a legal
question, not a technical one.

## Cost model — read before changing prize values

Stars cost the operator roughly **$0.013–0.02 each**. A simulated solo
card hits bingo about **62%** of the time within its 45-ball limit,
averaging ~36 balls. With 5 free cards a day, a fully engaged player wins
~3 rounds/day, landing mostly in the 40-ball tier.

At the shipped defaults that is **~7 Stars/day per active player, ~$0.10**.
A thousand daily actives is roughly **$100/day**. The cheapest gift in the
catalogue is 15 Stars, so the tiers are set so a prize takes a few days of
play to reach. Everything is in `lib/bingo/config.ts`; multiply by your
expected actives before raising anything.

## Setup

### 1. Database

Run `supabase/bingo_schema.sql` in the Supabase SQL editor, after
`schema.sql`. It creates seven `bingo_*` tables, a balances view and three
functions, and touches nothing the hotel app owns.

Every table has RLS enabled with **no policies**. That is intentional: the
bot connects with the service role key (which bypasses RLS), and anon or
authenticated clients get nothing. A browser must never be able to read
another player's card mid-round or write to the star ledger.

### 2. Bot

Create the bot with [@BotFather](https://t.me/BotFather), then:

- `/setprivacy` → **Disable** is *not* needed — the bot only reads
  commands, and Telegram delivers those to bots in groups regardless.
  Leave privacy mode **enabled**.
- `/setcommands`:

```
start - Start playing
play - Solo round
newround - Start a round in this group
stars - Your Star balance
prizes - Redeem Stars for a gift
top - Leaderboard
rules - How it works
cancel - Cancel the round in this chat
```

### 3. Environment

Copy from `.env.local.example`:

```
SUPABASE_SERVICE_ROLE_KEY=   # Supabase → Settings → API → service_role
TELEGRAM_BOT_TOKEN=          # BotFather
TELEGRAM_WEBHOOK_SECRET=     # openssl rand -hex 32
CRON_SECRET=                 # openssl rand -hex 32
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS on the entire project. Server-side
only — never prefix it with `NEXT_PUBLIC_`.

### 4. Webhook

After deploying:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://YOUR-DOMAIN/api/telegram/webhook",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["message", "callback_query", "pre_checkout_query"],
    "drop_pending_updates": true
  }'
```

Telegram sends that secret back in `X-Telegram-Bot-Api-Secret-Token` on
every update; the route rejects anything without it. Verify with
`getWebhookInfo` — `pending_update_count` climbing means the route is
erroring.

### 5. Timed group draws (optional)

Group rounds call a ball every `draw_interval_seconds` (12 by default).
Serverless has nothing to drive that clock, so `/api/telegram/tick` does,
and it is optional: **without any scheduler the host drives the round with
the "Call next ball" button** and everything else works.

To make rounds self-advancing, point any scheduler at it once a minute:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-DOMAIN/api/telegram/tick
```

One invocation stays alive for ~50s sweeping for due rounds, so a
once-a-minute ping yields near-continuous draws at the real interval. It
returns immediately when no round is live. Free options: cron-job.org,
UptimeRobot. Vercel Cron works on Pro (Hobby only allows daily). The
endpoint is idempotent — overlapping callers are safe, because
`bingo_draw_number()` takes a row lock.

## How a round works

**Solo** (`/play`, private chat) — one card, 45 balls, Draw button. Prize
scales with how few balls it took.

**Group** (`/newround`, group chat) — lobby → players tap Join for a card
→ host taps Start. One shared ball stream; the bot edits a single board
message per draw instead of spamming the chat. Prize grows with player
count.

Cards mark themselves — `bingo_cards.numbers` is written once and never
touched again, because a mark is derived from the round's `drawn` array at
render time. That is what keeps a 50-player round at one DB write per
ball instead of fifty.

Players read their own card via the **My card** button, which answers the
callback with an alert. No DM permission required, which matters because a
bot cannot message someone who has never opened a chat with it.

Claiming is first-past-the-post and validated server-side: the card is
checked against the balls already drawn, then the round is taken with a
conditional `UPDATE … WHERE status = 'running'`. In a crowded room several
people tap in the same instant and exactly one UPDATE matches. A claim with
no line is rejected and counted in `bad_claims`.

## Layout

```
app/api/telegram/webhook/route.ts   Update entry: secret check, dedupe, dispatch
app/api/telegram/tick/route.ts      Scheduler endpoint: timed draws, lobby sweep
lib/bingo/config.ts                 Game balance and prize economics
lib/bingo/engine.ts                 Pure rules: cards, marks, win detection, rendering
lib/bingo/store.ts                  Supabase access (service role)
lib/bingo/views.ts                  Message bodies and keyboards
lib/bingo/handlers.ts               Command and callback routing
supabase/bingo_schema.sql           Tables, RLS, draw/spend/win functions
```

`engine.ts` is pure — no Telegram, no database — so the rules are testable
on their own. It is the file to start with.

## Correctness notes for whoever picks this up

- **Update dedupe.** Telegram redelivers any update the webhook does not
  acknowledge fast. `bingo_updates` has `update_id` as its primary key and
  the first writer wins; a replay is dropped. Without it a retried claim
  pays twice.
- **The webhook always returns 200.** A non-2xx makes Telegram retry the
  same update in a loop. Handler errors are logged, not surfaced as status
  codes.
- **Draws are locked.** `bingo_draw_number()` takes `FOR UPDATE` on the
  round. The cron tick and a host's button press genuinely do land in the
  same second, and without the lock both would read the same `drawn` array
  and append a ball each.
- **The ledger is append-only.** A balance is `sum(amount)`, never a
  mutable column, matching `credit_ledger` in the hotel app. A partial
  unique index on `round_id where reason = 'round_win'` makes a double
  credit impossible at the database level.
- **Payouts debit before sending.** `bingo_spend_stars()` checks and
  inserts under one lock, so two taps on the same gift cannot both pass. A
  failed `sendGift` writes a `payout_refund` entry.

## Known gaps

- **No tests in CI.** The engine was verified with a throwaway harness
  (500 generated cards, every win pattern, 1000 simulated games). That
  harness was not kept — `engine.ts` is pure and the natural place to add
  a real test file.
- **One round per chat.** `/newround` refuses while a round is open.
- **One card per player per round**, enforced by a unique constraint.
- **No anti-collusion in group rounds.** Nothing stops one person running
  several accounts in a room to raise the per-opponent prize bonus.
- **Gift catalogue is unfiltered** beyond affordability — `/prizes` shows
  the eight priciest gifts the balance covers. Limited-edition gifts can
  sell out between listing and redemption; that surfaces as a failed
  payout with an automatic refund.
- **No admin tooling.** Adjusting a balance means an `admin_adjustment`
  row inserted by hand in the SQL editor.
- **No rate limiting** beyond the daily free-card budget.
