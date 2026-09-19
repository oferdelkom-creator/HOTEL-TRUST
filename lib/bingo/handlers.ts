// Update routing: commands, button callbacks, Stars payment hooks.

import { BINGO, PAID_CARD_PACK, PAID_CARDS_ENABLED, groupPrize, soloPrize } from "@/lib/bingo/config";
import { findWin, generateCard } from "@/lib/bingo/engine";
import * as db from "@/lib/bingo/store";
import type { BingoRound } from "@/lib/bingo/store";
import {
  answerCallback,
  answerPreCheckout,
  editMessageText,
  escapeHtml,
  getAvailableGifts,
  sendGift,
  sendMessage,
  sendStarInvoice,
  type InlineKeyboardButton,
  type TgCallbackQuery,
  type TgMessage,
  type TgPreCheckoutQuery,
  type TgUpdate,
} from "@/lib/bingo/telegram";
import * as view from "@/lib/bingo/views";

const PAID_PAYLOAD = "bingo-card-pack";

export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.message) return handleMessage(update.message);
  if (update.callback_query) return handleCallback(update.callback_query);
  if (update.pre_checkout_query) return handlePreCheckout(update.pre_checkout_query);
}

// ============================================================
// messages
// ============================================================

async function handleMessage(message: TgMessage): Promise<void> {
  if (message.successful_payment) return handleSuccessfulPayment(message);

  const from = message.from;
  const text = message.text?.trim();
  if (!from || from.is_bot || !text?.startsWith("/")) return;

  const player = await db.upsertPlayer(from.id, from.first_name, from.username);
  // Commands arrive as "/play@BotName" in groups.
  const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();
  const isPrivate = message.chat.type === "private";

  switch (command) {
    case "/start":
      await sendMessage(
        message.chat.id,
        view.welcome(from.first_name, await db.freeCardsLeft(player))
      );
      return;

    case "/rules":
    case "/help":
      await sendMessage(message.chat.id, view.rules());
      return;

    case "/play":
      await startSolo(message, player, isPrivate);
      return;

    case "/newround":
      await openLobby(message, player, isPrivate);
      return;

    case "/join":
    case "/begin":
      // Both are buttons on the lobby message; typing them just points
      // players back at it rather than duplicating the flow.
      await sendMessage(message.chat.id, "Use the buttons on the round message above.");
      return;

    case "/stars":
      await sendMessage(
        message.chat.id,
        view.balance(
          await db.starBalance(from.id),
          player.rounds_won,
          await db.freeCardsLeft(player)
        )
      );
      return;

    case "/prizes":
      await showPrizes(message.chat.id, from.id, isPrivate);
      return;

    case "/top":
      await showLeaderboard(message.chat.id);
      return;

    case "/cancel":
      await cancelHere(message, from.id);
      return;

    case "/buycards":
      await offerCardPack(message.chat.id, isPrivate);
      return;
  }
}

async function startSolo(
  message: TgMessage,
  player: db.BingoPlayer,
  isPrivate: boolean
): Promise<void> {
  if (!isPrivate) {
    await sendMessage(message.chat.id, "Solo rounds run in a private chat with me. Use /newround here instead.");
    return;
  }

  const existing = await db.openRoundInChat(message.chat.id);
  if (existing) {
    await sendMessage(message.chat.id, "You already have a round going. Finish it or /cancel first.");
    return;
  }

  if (!(await db.consumeFreeCard(player))) {
    await sendMessage(
      message.chat.id,
      `You've used all ${BINGO.freeCardsPerDay} free cards today. They reset at 00:00 UTC.` +
        (PAID_CARDS_ENABLED ? "\n\n/buycards for more." : "")
    );
    return;
  }

  const round = await db.createRound({
    chatId: message.chat.id,
    mode: "solo",
    hostTgId: player.tg_id,
    maxDraws: BINGO.solo.maxDraws,
    status: "running",
  });

  const card = await db.addCard(round.id, player.tg_id, generateCard());
  const sent = await sendMessage(
    message.chat.id,
    view.soloBoard(round, card.numbers),
    { keyboard: view.soloKeyboard(round, false) }
  );

  if (sent) await db.setBoardMessage(round.id, sent.message_id);
}

async function openLobby(
  message: TgMessage,
  player: db.BingoPlayer,
  isPrivate: boolean
): Promise<void> {
  if (isPrivate) {
    await sendMessage(message.chat.id, "Group rounds need a group chat. Add me to one, or play /play solo.");
    return;
  }

  const existing = await db.openRoundInChat(message.chat.id);
  if (existing) {
    await sendMessage(message.chat.id, "There's already a round open in this chat.");
    return;
  }

  const round = await db.createRound({
    chatId: message.chat.id,
    mode: "group",
    hostTgId: player.tg_id,
    maxDraws: BINGO.group.maxDraws,
    status: "lobby",
  });

  const sent = await sendMessage(
    message.chat.id,
    view.lobbyBoard(player.first_name ?? "host", 0),
    { keyboard: view.lobbyKeyboard(round.id) }
  );

  if (sent) await db.setBoardMessage(round.id, sent.message_id);
}

async function cancelHere(message: TgMessage, tgId: number): Promise<void> {
  const round = await db.openRoundInChat(message.chat.id);
  if (!round) {
    await sendMessage(message.chat.id, "Nothing to cancel here.");
    return;
  }

  if (round.host_tg_id !== tgId) {
    await sendMessage(message.chat.id, "Only the player who opened the round can cancel it.");
    return;
  }

  await db.cancelRound(round.id);
  await sendMessage(message.chat.id, "Round cancelled.");
}

// ============================================================
// callbacks
// ============================================================

async function handleCallback(query: TgCallbackQuery): Promise<void> {
  const [action, roundId] = (query.data ?? "").split(":");
  const from = query.from;

  if (action === "gift") {
    await redeemGift(query, roundId);
    return;
  }

  if (!roundId) {
    await answerCallback(query.id);
    return;
  }

  const round = await db.getRound(roundId);
  if (!round) {
    await answerCallback(query.id, "That round is gone.", true);
    return;
  }

  await db.upsertPlayer(from.id, from.first_name, from.username);

  switch (action) {
    case "join":
      await joinRound(query, round);
      return;
    case "begin":
      await beginRound(query, round);
      return;
    case "card":
      await showCard(query, round);
      return;
    case "draw":
      await manualDraw(query, round);
      return;
    case "bingo":
      await claimBingo(query, round);
      return;
    default:
      await answerCallback(query.id);
  }
}

async function joinRound(query: TgCallbackQuery, round: BingoRound): Promise<void> {
  if (round.status !== "lobby") {
    await answerCallback(query.id, "This round has already started.", true);
    return;
  }

  if (await db.getCard(round.id, query.from.id)) {
    await answerCallback(query.id, "You're already in — you have a card.", true);
    return;
  }

  const player = await db.upsertPlayer(query.from.id, query.from.first_name, query.from.username);
  if (!(await db.consumeFreeCard(player))) {
    await answerCallback(query.id, `No free cards left today. They reset at 00:00 UTC.`, true);
    return;
  }

  await db.addCard(round.id, query.from.id, generateCard());
  const count = await db.countCards(round.id);

  await answerCallback(query.id, "You're in. Tap 'My card' any time.", true);

  if (round.board_message_id) {
    await editMessageText(
      round.chat_id,
      round.board_message_id,
      view.lobbyBoard(query.from.first_name, count),
      view.lobbyKeyboard(round.id)
    );
  }
}

async function beginRound(query: TgCallbackQuery, round: BingoRound): Promise<void> {
  if (round.host_tg_id !== query.from.id) {
    await answerCallback(query.id, "Only the host can start the round.", true);
    return;
  }

  const count = await db.countCards(round.id);
  if (count < BINGO.group.minPlayers) {
    await answerCallback(query.id, `Need at least ${BINGO.group.minPlayers} players.`, true);
    return;
  }

  const started = await db.startRound(round.id);
  if (!started) {
    await answerCallback(query.id, "Already started.", true);
    return;
  }

  await answerCallback(query.id, "Round on!");
  // First ball immediately so the board isn't empty while the tick
  // interval elapses.
  await advanceRound(started);
}

async function showCard(query: TgCallbackQuery, round: BingoRound): Promise<void> {
  const card = await db.getCard(round.id, query.from.id);
  if (!card) {
    await answerCallback(query.id, "You're not in this round.", true);
    return;
  }

  await answerCallback(query.id, view.cardAlert(card.numbers, new Set(round.drawn)), true);
}

async function manualDraw(query: TgCallbackQuery, round: BingoRound): Promise<void> {
  if (round.status !== "running") {
    await answerCallback(query.id, "This round is over.", true);
    return;
  }

  if (round.mode === "group" && round.host_tg_id !== query.from.id) {
    await answerCallback(query.id, "Balls are called automatically — sit tight.", true);
    return;
  }

  await answerCallback(query.id);
  await advanceRound(round);
}

/**
 * Pulls one ball and republishes the board. Shared by the host's Draw
 * button and the cron tick, so both paths behave identically.
 */
export async function advanceRound(round: BingoRound): Promise<void> {
  const ball = await db.drawNumber(round.id);

  if (ball === null) {
    await closeOutRound(round);
    return;
  }

  const updated = await db.getRound(round.id);
  if (!updated) return;

  if (updated.mode === "solo") {
    const card = await db.getCard(updated.id, updated.host_tg_id);
    if (!card) return;

    const hasWin = findWin(card.numbers, new Set(updated.drawn)) !== null;
    const body = view.soloBoard(updated, card.numbers);

    if (updated.board_message_id) {
      await editMessageText(
        updated.chat_id,
        updated.board_message_id,
        body,
        view.soloKeyboard(updated, hasWin)
      );
    }

    if (updated.draw_count >= updated.max_draws && !hasWin) {
      await db.finishRound(updated.id);
      await sendMessage(updated.chat_id, view.soloLoss(updated, card.numbers));
    }
    return;
  }

  const count = await db.countCards(updated.id);
  if (updated.board_message_id) {
    await editMessageText(
      updated.chat_id,
      updated.board_message_id,
      view.groupBoard(updated, count),
      view.groupKeyboard(updated.id)
    );
  }

  if (updated.draw_count >= updated.max_draws) await closeOutRound(updated);
}

async function closeOutRound(round: BingoRound): Promise<void> {
  if (round.status !== "running") return;

  await db.finishRound(round.id);
  await sendMessage(round.chat_id, "🎱 All balls called — no bingo. Round over.");
}

/**
 * Validates the claim against the balls already out, then takes the round
 * atomically. Several players can tap BINGO in the same instant; only the
 * UPDATE that finds the round still 'running' wins.
 */
async function claimBingo(query: TgCallbackQuery, round: BingoRound): Promise<void> {
  if (round.status !== "running") {
    await answerCallback(query.id, "Too late — this round is over.", true);
    return;
  }

  const card = await db.getCard(round.id, query.from.id);
  if (!card) {
    await answerCallback(query.id, "You're not in this round.", true);
    return;
  }

  const pattern = findWin(card.numbers, new Set(round.drawn));
  if (!pattern) {
    await db.recordBadClaim(card.id, card.bad_claims);
    await answerCallback(query.id, "No line yet — check your card.", true);
    return;
  }

  const playerCount = await db.countCards(round.id);
  const stars =
    round.mode === "solo" ? soloPrize(round.draw_count) : groupPrize(playerCount);

  const won = await db.claimWin({
    roundId: round.id,
    winnerTgId: query.from.id,
    pattern,
    prizeStars: stars,
  });

  if (!won) {
    await answerCallback(query.id, "Someone beat you to it by a hair!", true);
    return;
  }

  await db.creditWin(query.from.id, round.id, stars);
  await answerCallback(query.id, `BINGO! +${stars} ⭐`, true);

  const announcement = view.winAnnouncement({
    name: query.from.first_name,
    pattern,
    stars,
    drawCount: round.draw_count,
  });

  if (round.board_message_id) {
    await editMessageText(round.chat_id, round.board_message_id, announcement);
  } else {
    await sendMessage(round.chat_id, announcement);
  }
}

// ============================================================
// prizes
// ============================================================

async function showPrizes(chatId: number, tgId: number, isPrivate: boolean): Promise<void> {
  if (!isPrivate) {
    await sendMessage(chatId, "Open a private chat with me to redeem prizes.");
    return;
  }

  const stars = await db.starBalance(tgId);
  if (stars <= 0) {
    await sendMessage(chatId, "No Stars yet — win a round first. /play");
    return;
  }

  const available = await getAvailableGifts();
  const gifts = (available?.gifts ?? [])
    .filter((gift) => gift.star_count <= stars)
    .sort((a, b) => b.star_count - a.star_count)
    .slice(0, 8);

  if (gifts.length === 0) {
    await sendMessage(
      chatId,
      `You have <b>${stars} ⭐</b>, but nothing in the gift catalogue is within reach yet. Keep playing.`
    );
    return;
  }

  const keyboard: InlineKeyboardButton[][] = gifts.map((gift) => [
    {
      text: `${gift.sticker?.emoji ?? "🎁"} ${gift.star_count} ⭐`,
      callback_data: `gift:${gift.id}`,
    },
  ]);

  await sendMessage(
    chatId,
    `⭐ <b>${stars} Stars</b>\n\nPick a gift — I'll send it straight to you.`,
    { keyboard }
  );
}

/**
 * The payout. There's no Bot API call that credits Stars to a user, so a
 * prize is a real gift the bot buys from its own Star balance. Ledger is
 * debited first (so two taps can't both pay), and refunded if Telegram
 * rejects the send - which is exactly what happens when the bot's own
 * balance is short.
 */
async function redeemGift(query: TgCallbackQuery, giftId: string): Promise<void> {
  if (!giftId) {
    await answerCallback(query.id);
    return;
  }

  const catalogue = await getAvailableGifts();
  const gift = catalogue?.gifts.find((g) => g.id === giftId);
  if (!gift) {
    await answerCallback(query.id, "That gift is no longer available.", true);
    return;
  }

  const payoutId = await db.createPayout(query.from.id, gift.id, gift.star_count);
  if (!(await db.spendStars(query.from.id, payoutId, gift.star_count))) {
    await db.markPayout(payoutId, "failed", "insufficient balance");
    await answerCallback(query.id, "Not enough Stars.", true);
    return;
  }

  try {
    await sendGift(query.from.id, gift.id, "Your bingo prize 🎱");
    await db.markPayout(payoutId, "sent");
    await answerCallback(query.id, "Gift sent! 🎁", true);
    await sendMessage(
      query.from.id,
      `🎁 <b>Prize sent</b> — ${gift.star_count} ⭐ redeemed.\n\nBalance: <b>${await db.starBalance(query.from.id)} ⭐</b>`
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "send failed";
    await db.markPayout(payoutId, "failed", reason);
    await db.refundPayout(query.from.id, payoutId, gift.star_count);
    await answerCallback(query.id, "Couldn't send that gift — your Stars are back.", true);
    console.error("[bingo] gift payout failed", reason);
  }
}

async function showLeaderboard(chatId: number): Promise<void> {
  const top = await db.leaderboard();
  if (top.length === 0) {
    await sendMessage(chatId, "No winners yet. Be the first — /play");
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const lines = top.map(
    (row, i) =>
      `${medals[i] ?? `${i + 1}.`} ${escapeHtml(row.first_name ?? "player")} — ${row.rounds_won}`
  );

  await sendMessage(chatId, ["🏆 <b>Most rounds won</b>", "", ...lines].join("\n"));
}

// ============================================================
// paid cards (disabled by default)
// ============================================================

async function offerCardPack(chatId: number, isPrivate: boolean): Promise<void> {
  if (!PAID_CARDS_ENABLED) {
    await sendMessage(
      chatId,
      "There's nothing to buy here — bingo is free to play, and always will be. Free cards reset at 00:00 UTC."
    );
    return;
  }

  if (!isPrivate) {
    await sendMessage(chatId, "Open a private chat with me to buy cards.");
    return;
  }

  await sendStarInvoice(
    chatId,
    `${PAID_CARD_PACK.cards} bingo cards`,
    `${PAID_CARD_PACK.cards} extra cards for today.`,
    PAID_PAYLOAD,
    PAID_CARD_PACK.stars
  );
}

async function handlePreCheckout(query: TgPreCheckoutQuery): Promise<void> {
  // Re-checked at charge time: flipping the flag off must stop taking
  // money even if an invoice is already sitting in someone's chat.
  if (!PAID_CARDS_ENABLED || query.invoice_payload !== PAID_PAYLOAD) {
    await answerPreCheckout(query.id, false, "This purchase is no longer available.");
    return;
  }

  await answerPreCheckout(query.id, true);
}

async function handleSuccessfulPayment(message: TgMessage): Promise<void> {
  const payment = message.successful_payment;
  const from = message.from;
  if (!payment || !from) return;

  const fresh = await db.recordPayment({
    chargeId: payment.telegram_payment_charge_id,
    tgId: from.id,
    stars: payment.total_amount,
    cards: PAID_CARD_PACK.cards,
  });

  if (!fresh) return; // replayed update

  await db.grantCards(from.id, PAID_CARD_PACK.cards);
  await sendMessage(message.chat.id, `Added ${PAID_CARD_PACK.cards} cards. /play`);
}
