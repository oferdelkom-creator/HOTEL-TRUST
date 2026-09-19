-- Telegram Bingo bot: solo + group rounds, Telegram Stars prizes.
-- Run this file once in the Supabase SQL editor, after schema.sql.
--
-- Every table here is bot-owned: the webhook talks to Supabase with the
-- service role key, never with a user session. So RLS is enabled with no
-- policies at all - anon and authenticated get nothing, the service role
-- bypasses RLS entirely. That's deliberate: a browser must never be able
-- to read another player's card mid-round or touch the star ledger.

-- ============================================================
-- players
-- ============================================================
create table bingo_players (
  tg_id bigint primary key,
  username text,
  first_name text,
  -- free-play budget, reset lazily on first play of a new UTC day rather
  -- than by a scheduled job (no cron dependency for the core loop).
  free_cards_date date not null default (now() at time zone 'utc')::date,
  free_cards_used smallint not null default 0,
  rounds_won integer not null default 0,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table bingo_players enable row level security;

-- ============================================================
-- rounds
-- ============================================================
-- A round is one bingo game. 'solo' runs in a private chat and advances
-- when the player taps Draw; 'group' runs in a group chat and advances on
-- a timer (the /api/telegram/tick cron) or when the host taps Draw.
create table bingo_rounds (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null,
  mode text not null check (mode in ('solo', 'group')),
  status text not null default 'lobby' check (status in ('lobby', 'running', 'finished', 'cancelled')),
  host_tg_id bigint not null references bingo_players (tg_id) on delete cascade,
  -- drawn balls in draw order; the source of truth for every card's marks.
  -- Cards are never mutated during a round - marking is derived from this
  -- array at render time, so there's no per-player write on each draw.
  drawn smallint[] not null default '{}',
  draw_count smallint not null default 0,
  -- a round that never hits bingo still has to end; 75 = full pool.
  max_draws smallint not null default 75 check (max_draws between 5 and 75),
  draw_interval_seconds smallint not null default 12,
  last_draw_at timestamptz,
  winner_tg_id bigint references bingo_players (tg_id) on delete set null,
  win_pattern text,
  prize_stars integer not null default 0,
  -- the group message the bot edits on every draw, so a round doesn't
  -- spam the chat with one message per ball.
  board_message_id bigint,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index bingo_rounds_chat_open_idx on bingo_rounds (chat_id)
  where status in ('lobby', 'running');
create index bingo_rounds_tick_idx on bingo_rounds (last_draw_at)
  where status = 'running' and mode = 'group';

alter table bingo_rounds enable row level security;

-- ============================================================
-- cards
-- ============================================================
-- 25 numbers, column-major B/I/N/G/O, index 12 is the free centre stored
-- as 0. One card per player per round.
create table bingo_cards (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references bingo_rounds (id) on delete cascade,
  player_tg_id bigint not null references bingo_players (tg_id) on delete cascade,
  numbers smallint[] not null check (array_length(numbers, 1) = 25),
  -- a claim that wasn't actually a bingo; kept to discourage spam-claiming
  -- every draw in a big room.
  bad_claims smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (round_id, player_tg_id)
);

create index bingo_cards_round_idx on bingo_cards (round_id);

alter table bingo_cards enable row level security;

-- ============================================================
-- star ledger
-- ============================================================
-- Append-only, same shape as the hotel credit_ledger: a balance is
-- sum(amount), never a mutable column, so a payout can't silently
-- overwrite what a player earned.
create table bingo_star_ledger (
  id uuid primary key default gen_random_uuid(),
  player_tg_id bigint not null references bingo_players (tg_id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('round_win', 'payout', 'payout_refund', 'admin_adjustment')),
  round_id uuid references bingo_rounds (id) on delete set null,
  payout_id uuid,
  created_at timestamptz not null default now()
);

create index bingo_star_ledger_player_idx on bingo_star_ledger (player_tg_id);

-- one win entry per round, so a retried webhook update can't pay twice.
create unique index bingo_star_ledger_one_win_per_round
  on bingo_star_ledger (round_id) where reason = 'round_win';

alter table bingo_star_ledger enable row level security;

create view bingo_star_balances as
  select player_tg_id, coalesce(sum(amount), 0)::integer as balance
  from bingo_star_ledger
  group by player_tg_id;

-- ============================================================
-- payouts
-- ============================================================
-- The Bot API cannot move Stars into a user's balance. What it can do is
-- buy a gift with the BOT's own star balance and send it (sendGift). So a
-- payout is a gift: the ledger is debited when the player redeems, and
-- refunded if Telegram rejects the send (e.g. the bot is out of Stars).
create table bingo_payouts (
  id uuid primary key default gen_random_uuid(),
  player_tg_id bigint not null references bingo_players (tg_id) on delete cascade,
  gift_id text not null,
  star_cost integer not null check (star_cost > 0),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index bingo_payouts_player_idx on bingo_payouts (player_tg_id);

alter table bingo_payouts enable row level security;

-- ============================================================
-- payments (paid cards - off by default, see BINGO_PAID_CARDS env flag)
-- ============================================================
-- Selling entries for Stars while paying out Stars prizes is gambling in
-- most jurisdictions and is barred by Telegram's own Stars terms. The
-- table and the invoice handler exist so the decision is an explicit,
-- reviewable config change - not a code rewrite.
create table bingo_payments (
  telegram_payment_charge_id text primary key,
  player_tg_id bigint not null references bingo_players (tg_id) on delete cascade,
  stars_paid integer not null,
  cards_granted smallint not null,
  refunded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table bingo_payments enable row level security;

-- ============================================================
-- update dedupe
-- ============================================================
-- Telegram redelivers an update if the webhook doesn't 200 quickly. The
-- primary key makes replays no-ops instead of double draws or double
-- payouts.
create table bingo_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);

alter table bingo_updates enable row level security;

-- ============================================================
-- draw_number()
-- ============================================================
-- Picks one unseen ball for a running round. `for update` serialises the
-- concurrent callers this will genuinely have: the cron tick and the
-- host's Draw tap can land in the same second, and without the lock both
-- would read the same `drawn` array and append a ball each.
create function bingo_draw_number(p_round_id uuid)
returns smallint
language plpgsql security definer as $$
declare
  r bingo_rounds;
  pool smallint[];
  picked smallint;
begin
  select * into r from bingo_rounds where id = p_round_id for update;

  if not found or r.status <> 'running' then
    return null;
  end if;

  if r.draw_count >= r.max_draws then
    update bingo_rounds set status = 'finished', finished_at = now() where id = p_round_id;
    return null;
  end if;

  select array_agg(g.n::smallint) into pool
  from generate_series(1, 75) as g(n)
  where not (g.n::smallint = any (r.drawn));

  if pool is null or array_length(pool, 1) = 0 then
    update bingo_rounds set status = 'finished', finished_at = now() where id = p_round_id;
    return null;
  end if;

  picked := pool[1 + floor(random() * array_length(pool, 1))::int];

  update bingo_rounds
  set drawn = array_append(drawn, picked),
      draw_count = draw_count + 1,
      last_draw_at = now()
  where id = p_round_id;

  return picked;
end;
$$;

-- ============================================================
-- spend_stars()
-- ============================================================
-- Debits a redemption only if the balance actually covers it, inside one
-- statement, so two taps on the same gift button can't both go through.
create function bingo_spend_stars(p_player bigint, p_payout uuid, p_amount integer)
returns boolean
language plpgsql security definer as $$
declare
  current_balance integer;
begin
  select coalesce(sum(amount), 0) into current_balance
  from bingo_star_ledger where player_tg_id = p_player for update;

  if current_balance < p_amount then
    return false;
  end if;

  insert into bingo_star_ledger (player_tg_id, amount, reason, payout_id)
  values (p_player, -p_amount, 'payout', p_payout);

  return true;
end;
$$;

-- ============================================================
-- increment_wins()
-- ============================================================
-- A counter bump that can't lose a concurrent win in another chat, and
-- keeps the leaderboard query off a sum over the whole ledger.
create function bingo_increment_wins(p_player bigint)
returns void
language sql security definer as $$
  update bingo_players set rounds_won = rounds_won + 1 where tg_id = p_player;
$$;
