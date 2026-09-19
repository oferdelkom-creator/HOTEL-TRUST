// Message bodies and keyboards. Kept apart from the handlers so wording
// changes don't touch game logic.

import { BINGO, PAID_CARD_PACK, PAID_CARDS_ENABLED } from "@/lib/bingo/config";
import {
  ballLabel,
  cellsToWin,
  renderCard,
  renderCardCompact,
  renderRecentDraws,
} from "@/lib/bingo/engine";
import type { InlineKeyboardButton } from "@/lib/bingo/telegram";
import { escapeHtml } from "@/lib/bingo/telegram";
import type { BingoRound } from "@/lib/bingo/store";

export function welcome(firstName: string, freeLeft: number): string {
  return [
    `🎱 <b>Welcome to Bingo, ${escapeHtml(firstName)}!</b>`,
    "",
    "Free to play. Win rounds, collect ⭐ Stars, redeem them for real Telegram gifts.",
    "",
    `You have <b>${freeLeft}</b> free card${freeLeft === 1 ? "" : "s"} left today.`,
    "",
    "/play — solo round against the caller",
    "/newround — start a round in a group chat",
    "/stars — your Star balance",
    "/prizes — redeem Stars for a gift",
    "/top — leaderboard",
    "/rules — how it works",
  ].join("\n");
}

export function rules(): string {
  return [
    "🎱 <b>How it works</b>",
    "",
    `Standard 75-ball bingo. Your card is 5×5 — column B holds 1-15, I holds 16-30, N 31-45, G 46-60, O 61-75 — with a free centre square.`,
    "",
    "Balls are called one at a time and your card marks itself. Complete any row, column or diagonal and hit <b>BINGO!</b> — first valid claim takes the round.",
    "",
    `<b>Solo:</b> you have ${BINGO.solo.maxDraws} balls to get there. The faster you do, the bigger the prize.`,
    `<b>Group:</b> everyone shares one set of called balls. Prize grows with the number of players.`,
    "",
    "<b>⭐ Stars</b>",
    `Entry is always free — ${BINGO.freeCardsPerDay} cards a day, reset at 00:00 UTC.`,
    "Stars you win are held in your balance and redeemed for a real Telegram gift via /prizes.",
    PAID_CARDS_ENABLED
      ? `Extra cards: ${PAID_CARD_PACK.cards} for ${PAID_CARD_PACK.stars} ⭐ (/buycards).`
      : "There is nothing to buy — no purchase is ever required to play or to win.",
  ].join("\n");
}

export function soloBoard(round: BingoRound, card: readonly number[]): string {
  const drawn = new Set(round.drawn);
  const away = cellsToWin(card, drawn);
  const last = round.drawn.at(-1);

  const lines = [
    last ? `🎱 <b>${ballLabel(last)}</b>` : "🎱 <b>Your card</b>",
    "",
    `<pre>${renderCard(card, drawn)}</pre>`,
    `Ball ${round.draw_count}/${round.max_draws}`,
  ];

  if (round.status === "running") {
    lines.push(away === 1 ? "🔥 <b>One square away!</b>" : `${away} squares from a line.`);
  }

  return lines.join("\n");
}

export function soloKeyboard(round: BingoRound, canClaim: boolean): InlineKeyboardButton[][] {
  const row: InlineKeyboardButton[] = [{ text: "🎱 Draw", callback_data: `draw:${round.id}` }];
  if (canClaim) row.push({ text: "🎉 BINGO!", callback_data: `bingo:${round.id}` });
  return [row];
}

export function lobbyBoard(hostName: string, playerCount: number): string {
  return [
    "🎱 <b>Bingo round — open for players</b>",
    "",
    `Host: ${escapeHtml(hostName)}`,
    `Players: <b>${playerCount}</b>`,
    "",
    `Tap Join to get a card. The host starts the round once at least ${BINGO.group.minPlayers} players are in.`,
    "Entry is free.",
  ].join("\n");
}

export function lobbyKeyboard(roundId: string): InlineKeyboardButton[][] {
  return [
    [{ text: "🎴 Join", callback_data: `join:${roundId}` }],
    [{ text: "▶️ Start round (host)", callback_data: `begin:${roundId}` }],
  ];
}

export function groupBoard(round: BingoRound, playerCount: number): string {
  const last = round.drawn.at(-1);

  return [
    last ? `🎱 <b>${ballLabel(last)}</b>` : "🎱 <b>Round starting…</b>",
    "",
    `Recent: ${renderRecentDraws(round.drawn)}`,
    `Ball ${round.draw_count}/${round.max_draws} · ${playerCount} player${playerCount === 1 ? "" : "s"}`,
    "",
    "Tap <b>My card</b> to see yours. Line complete? Hit <b>BINGO!</b> first.",
  ].join("\n");
}

export function groupKeyboard(roundId: string): InlineKeyboardButton[][] {
  return [
    [
      { text: "🎴 My card", callback_data: `card:${roundId}` },
      { text: "🎉 BINGO!", callback_data: `bingo:${roundId}` },
    ],
    // Host-only (enforced in the handler, not here - a keyboard is the
    // same for everyone who can see the message). Lets a round run at
    // conversation speed even with no scheduler wired up.
    [{ text: "🎱 Call next ball (host)", callback_data: `draw:${roundId}` }],
  ];
}

export function winAnnouncement(params: {
  name: string;
  pattern: string;
  stars: number;
  drawCount: number;
}): string {
  return [
    `🎉 <b>BINGO!</b> ${escapeHtml(params.name)} takes the round.`,
    "",
    `Line: ${escapeHtml(params.pattern)} · called in ${params.drawCount} balls`,
    `Prize: <b>${params.stars} ⭐</b>`,
    "",
    "Redeem with /prizes.",
  ].join("\n");
}

export function soloLoss(round: BingoRound, card: readonly number[]): string {
  return [
    "😔 <b>No bingo this time.</b>",
    "",
    `<pre>${renderCard(card, new Set(round.drawn))}</pre>`,
    `All ${round.max_draws} balls called.`,
    "",
    "/play for another card.",
  ].join("\n");
}

export function cardAlert(card: readonly number[], drawn: ReadonlySet<number>): string {
  const away = cellsToWin(card, drawn);
  return `${renderCardCompact(card, drawn)}\n\n${away === 0 ? "BINGO — claim it!" : `${away} to go`}`;
}

export function balance(stars: number, roundsWon: number, freeLeft: number): string {
  return [
    `⭐ <b>${stars} Stars</b>`,
    "",
    `Rounds won: ${roundsWon}`,
    `Free cards left today: ${freeLeft}/${BINGO.freeCardsPerDay}`,
    "",
    stars > 0 ? "Use /prizes to turn Stars into a real Telegram gift." : "Win a round to start collecting.",
  ].join("\n");
}
