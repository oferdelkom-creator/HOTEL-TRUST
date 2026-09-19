// Tunables for the bingo bot, kept in one place so game balance is a
// config change rather than a hunt through the handlers.

export const BINGO = {
  // Classic 75-ball: five columns of fifteen, free centre square.
  columnSize: 15,
  columns: 5,
  rows: 5,
  freeIndex: 12,

  // Free-play budget per UTC day. Entry is free by design - see
  // PAID_CARDS below and docs/telegram-bingo.md.
  freeCardsPerDay: 5,

  solo: {
    // A solo card that hasn't hit bingo in 45 balls is a loss; without a
    // cap every solo game eventually wins and the prize means nothing.
    maxDraws: 45,
  },

  group: {
    maxDraws: 75,
    drawIntervalSeconds: 12,
    minPlayers: 2,
    // A lobby nobody starts shouldn't sit open forever holding the chat's
    // "one active round" slot.
    lobbyTimeoutMinutes: 10,
  },

  // Prize in Stars. Faster bingo pays more, and a group round pays a
  // bonus per opponent so a crowded room is worth more than a duel.
  //
  // READ BEFORE RAISING THESE. Every Star paid out is real money the bot
  // owner funds (~$0.013-0.02 per Star). A simulated 45-ball solo card
  // hits bingo ~62% of the time, averaging ~36 balls, so a player who
  // burns all 5 free cards wins roughly 3 rounds a day and lands mostly
  // in the 40-ball tier. At the numbers below that's ~7 Stars/day per
  // active player - about $0.10. Multiply by your daily actives before
  // touching any of this; the cheapest redeemable gift is 15 Stars, so
  // these tiers are deliberately set so a prize takes a few days to
  // reach rather than falling out of a single session.
  prize: {
    soloTiers: [
      { maxDraws: 20, stars: 10 },
      { maxDraws: 30, stars: 5 },
      { maxDraws: 40, stars: 2 },
      { maxDraws: 45, stars: 1 },
    ],
    groupBase: 10,
    groupPerOpponent: 2,
    groupMax: 50,
  },
} as const;

// Selling cards for Stars while paying Stars prizes turns this into
// gambling - barred by Telegram's Stars terms and licensed in most
// countries. Off unless someone deliberately sets the env var, and the
// handler re-checks it at call time.
export const PAID_CARDS_ENABLED = process.env.BINGO_PAID_CARDS === "true";

export const PAID_CARD_PACK = { cards: 5, stars: 15 } as const;

export function soloPrize(drawCount: number): number {
  for (const tier of BINGO.prize.soloTiers) {
    if (drawCount <= tier.maxDraws) return tier.stars;
  }
  return 0;
}

export function groupPrize(playerCount: number): number {
  const opponents = Math.max(0, playerCount - 1);
  return Math.min(
    BINGO.prize.groupMax,
    BINGO.prize.groupBase + opponents * BINGO.prize.groupPerOpponent
  );
}
