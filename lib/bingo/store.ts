// Supabase access for the bot. The webhook has no user session, so this
// uses the service role key and every table it touches has RLS enabled
// with zero policies (see supabase/bingo_schema.sql) - browsers get
// nothing, the bot gets everything.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BINGO } from "@/lib/bingo/config";

export interface BingoPlayer {
  tg_id: number;
  username: string | null;
  first_name: string | null;
  free_cards_date: string;
  free_cards_used: number;
  rounds_won: number;
}

export type RoundMode = "solo" | "group";
export type RoundStatus = "lobby" | "running" | "finished" | "cancelled";

export interface BingoRound {
  id: string;
  chat_id: number;
  mode: RoundMode;
  status: RoundStatus;
  host_tg_id: number;
  drawn: number[];
  draw_count: number;
  max_draws: number;
  draw_interval_seconds: number;
  last_draw_at: string | null;
  winner_tg_id: number | null;
  win_pattern: string | null;
  prize_stars: number;
  board_message_id: number | null;
  started_at: string | null;
}

export interface BingoCard {
  id: string;
  round_id: string;
  player_tg_id: number;
  numbers: number[];
  bad_claims: number;
}

let cached: SupabaseClient | null = null;

export function botDb(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

/**
 * Returns false if this update_id was already processed. Telegram
 * redelivers an update whenever the webhook is slow, and a replayed
 * "draw" or "claim" would corrupt a round.
 */
export async function claimUpdate(updateId: number): Promise<boolean> {
  const { error } = await botDb().from("bingo_updates").insert({ update_id: updateId });
  if (!error) return true;
  if (error.code === "23505") return false; // unique violation: already seen
  throw error;
}

export async function upsertPlayer(
  tgId: number,
  firstName: string,
  username?: string
): Promise<BingoPlayer> {
  const { data, error } = await botDb()
    .from("bingo_players")
    .upsert(
      { tg_id: tgId, first_name: firstName, username: username ?? null, last_seen_at: new Date().toISOString() },
      { onConflict: "tg_id" }
    )
    .select()
    .single<BingoPlayer>();

  if (error) throw error;
  return data;
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Spends one free card if the player has any left today. The daily reset
 * happens here rather than in a scheduled job: a stale date row simply
 * means the budget is full again.
 */
export async function consumeFreeCard(player: BingoPlayer): Promise<boolean> {
  const today = utcToday();
  const used = player.free_cards_date === today ? player.free_cards_used : 0;

  if (used >= BINGO.freeCardsPerDay) return false;

  const { error } = await botDb()
    .from("bingo_players")
    .update({ free_cards_date: today, free_cards_used: used + 1 })
    .eq("tg_id", player.tg_id);

  if (error) throw error;
  return true;
}

export async function freeCardsLeft(player: BingoPlayer): Promise<number> {
  const used = player.free_cards_date === utcToday() ? player.free_cards_used : 0;
  return Math.max(0, BINGO.freeCardsPerDay - used);
}

export async function grantCards(tgId: number, cards: number): Promise<void> {
  const { data } = await botDb()
    .from("bingo_players")
    .select("free_cards_date, free_cards_used")
    .eq("tg_id", tgId)
    .maybeSingle<Pick<BingoPlayer, "free_cards_date" | "free_cards_used">>();

  const today = utcToday();
  const used = data?.free_cards_date === today ? data.free_cards_used : 0;

  await botDb()
    .from("bingo_players")
    .update({ free_cards_date: today, free_cards_used: Math.max(0, used - cards) })
    .eq("tg_id", tgId);
}

export async function openRoundInChat(chatId: number): Promise<BingoRound | null> {
  const { data, error } = await botDb()
    .from("bingo_rounds")
    .select("*")
    .eq("chat_id", chatId)
    .in("status", ["lobby", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<BingoRound>();

  if (error) throw error;
  return data;
}

export async function getRound(roundId: string): Promise<BingoRound | null> {
  const { data, error } = await botDb()
    .from("bingo_rounds")
    .select("*")
    .eq("id", roundId)
    .maybeSingle<BingoRound>();

  if (error) throw error;
  return data;
}

export async function createRound(params: {
  chatId: number;
  mode: RoundMode;
  hostTgId: number;
  maxDraws: number;
  status: RoundStatus;
  drawIntervalSeconds?: number;
}): Promise<BingoRound> {
  const { data, error } = await botDb()
    .from("bingo_rounds")
    .insert({
      chat_id: params.chatId,
      mode: params.mode,
      host_tg_id: params.hostTgId,
      max_draws: params.maxDraws,
      status: params.status,
      draw_interval_seconds: params.drawIntervalSeconds ?? BINGO.group.drawIntervalSeconds,
      started_at: params.status === "running" ? new Date().toISOString() : null,
    })
    .select()
    .single<BingoRound>();

  if (error) throw error;
  return data;
}

export async function addCard(roundId: string, playerTgId: number, numbers: number[]): Promise<BingoCard> {
  const { data, error } = await botDb()
    .from("bingo_cards")
    .insert({ round_id: roundId, player_tg_id: playerTgId, numbers })
    .select()
    .single<BingoCard>();

  if (error) throw error;
  return data;
}

export async function getCard(roundId: string, playerTgId: number): Promise<BingoCard | null> {
  const { data, error } = await botDb()
    .from("bingo_cards")
    .select("*")
    .eq("round_id", roundId)
    .eq("player_tg_id", playerTgId)
    .maybeSingle<BingoCard>();

  if (error) throw error;
  return data;
}

export async function roundCards(roundId: string): Promise<BingoCard[]> {
  const { data, error } = await botDb()
    .from("bingo_cards")
    .select("*")
    .eq("round_id", roundId);

  if (error) throw error;
  return data ?? [];
}

export async function countCards(roundId: string): Promise<number> {
  const { count, error } = await botDb()
    .from("bingo_cards")
    .select("id", { count: "exact", head: true })
    .eq("round_id", roundId);

  if (error) throw error;
  return count ?? 0;
}

export async function recordBadClaim(cardId: string, current: number): Promise<void> {
  await botDb().from("bingo_cards").update({ bad_claims: current + 1 }).eq("id", cardId);
}

export async function setBoardMessage(roundId: string, messageId: number): Promise<void> {
  await botDb().from("bingo_rounds").update({ board_message_id: messageId }).eq("id", roundId);
}

/** Lobby -> running, refusing the transition if someone else got there first. */
export async function startRound(roundId: string): Promise<BingoRound | null> {
  const { data, error } = await botDb()
    .from("bingo_rounds")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", roundId)
    .eq("status", "lobby")
    .select()
    .maybeSingle<BingoRound>();

  if (error) throw error;
  return data;
}

export async function cancelRound(roundId: string): Promise<void> {
  await botDb()
    .from("bingo_rounds")
    .update({ status: "cancelled", finished_at: new Date().toISOString() })
    .eq("id", roundId)
    .in("status", ["lobby", "running"]);
}

export async function drawNumber(roundId: string): Promise<number | null> {
  const { data, error } = await botDb().rpc("bingo_draw_number", { p_round_id: roundId });
  if (error) throw error;
  return (data as number | null) ?? null;
}

/**
 * The race that matters: in a crowded room several players can tap BINGO
 * in the same instant. The status guard means exactly one UPDATE finds a
 * 'running' row, and everyone else gets null back.
 */
export async function claimWin(params: {
  roundId: string;
  winnerTgId: number;
  pattern: string;
  prizeStars: number;
}): Promise<BingoRound | null> {
  const { data, error } = await botDb()
    .from("bingo_rounds")
    .update({
      status: "finished",
      finished_at: new Date().toISOString(),
      winner_tg_id: params.winnerTgId,
      win_pattern: params.pattern,
      prize_stars: params.prizeStars,
    })
    .eq("id", params.roundId)
    .eq("status", "running")
    .select()
    .maybeSingle<BingoRound>();

  if (error) throw error;
  return data;
}

export async function finishRound(roundId: string): Promise<void> {
  await botDb()
    .from("bingo_rounds")
    .update({ status: "finished", finished_at: new Date().toISOString() })
    .eq("id", roundId)
    .eq("status", "running");
}

export async function creditWin(tgId: number, roundId: string, stars: number): Promise<void> {
  const { error } = await botDb()
    .from("bingo_star_ledger")
    .insert({ player_tg_id: tgId, amount: stars, reason: "round_win", round_id: roundId });

  // The partial unique index on round_id makes a replayed win a no-op
  // rather than a double payout.
  if (error && error.code !== "23505") throw error;

  await botDb().rpc("bingo_increment_wins", { p_player: tgId }).throwOnError();
}

export async function starBalance(tgId: number): Promise<number> {
  const { data, error } = await botDb()
    .from("bingo_star_balances")
    .select("balance")
    .eq("player_tg_id", tgId)
    .maybeSingle<{ balance: number }>();

  if (error) throw error;
  return data?.balance ?? 0;
}

export async function leaderboard(limit = 10): Promise<Array<{ tg_id: number; first_name: string | null; rounds_won: number }>> {
  const { data, error } = await botDb()
    .from("bingo_players")
    .select("tg_id, first_name, rounds_won")
    .gt("rounds_won", 0)
    .order("rounds_won", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function createPayout(tgId: number, giftId: string, starCost: number): Promise<string> {
  const { data, error } = await botDb()
    .from("bingo_payouts")
    .insert({ player_tg_id: tgId, gift_id: giftId, star_cost: starCost })
    .select("id")
    .single<{ id: string }>();

  if (error) throw error;
  return data.id;
}

/** Debits the ledger only if the balance covers it (see bingo_spend_stars). */
export async function spendStars(tgId: number, payoutId: string, amount: number): Promise<boolean> {
  const { data, error } = await botDb().rpc("bingo_spend_stars", {
    p_player: tgId,
    p_payout: payoutId,
    p_amount: amount,
  });

  if (error) throw error;
  return data === true;
}

export async function markPayout(
  payoutId: string,
  status: "sent" | "failed",
  errorMessage?: string
): Promise<void> {
  await botDb()
    .from("bingo_payouts")
    .update({
      status,
      error: errorMessage ?? null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", payoutId);
}

/** Gives the stars back when Telegram refuses the gift send. */
export async function refundPayout(tgId: number, payoutId: string, amount: number): Promise<void> {
  await botDb().from("bingo_star_ledger").insert({
    player_tg_id: tgId,
    amount,
    reason: "payout_refund",
    payout_id: payoutId,
  });
}

export async function recordPayment(params: {
  chargeId: string;
  tgId: number;
  stars: number;
  cards: number;
}): Promise<boolean> {
  const { error } = await botDb().from("bingo_payments").insert({
    telegram_payment_charge_id: params.chargeId,
    player_tg_id: params.tgId,
    stars_paid: params.stars,
    cards_granted: params.cards,
  });

  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

/** Every live group round - the tick uses this to know when to stop. */
export async function runningGroupRounds(limit = 25): Promise<BingoRound[]> {
  const { data, error } = await botDb()
    .from("bingo_rounds")
    .select("*")
    .eq("status", "running")
    .eq("mode", "group")
    .order("last_draw_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Of those, the ones whose next ball is due now. */
export function dueForDraw(rounds: readonly BingoRound[]): BingoRound[] {
  const now = Date.now();
  return rounds.filter((round) => {
    if (!round.last_draw_at) return true;
    return now - new Date(round.last_draw_at).getTime() >= round.draw_interval_seconds * 1000;
  });
}

/** Lobbies nobody ever started, so a dead lobby stops blocking the chat. */
export async function staleLobbies(minutes: number): Promise<BingoRound[]> {
  const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();

  const { data, error } = await botDb()
    .from("bingo_rounds")
    .select("*")
    .eq("status", "lobby")
    .lt("created_at", cutoff)
    .limit(25);

  if (error) throw error;
  return data ?? [];
}
