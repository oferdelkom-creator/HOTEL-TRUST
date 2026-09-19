// Pure bingo rules: card generation, marking, win detection, rendering.
// No Telegram and no database in here, so the game logic stays testable
// on its own.

import { BINGO } from "@/lib/bingo/config";

export const COLUMN_LETTERS = ["B", "I", "N", "G", "O"] as const;

export type WinPattern =
  | `row-${number}`
  | `column-${string}`
  | "diagonal-down"
  | "diagonal-up";

/**
 * A card is 25 numbers in column-major order: indexes 0-4 are the B
 * column, 5-9 the I column, and so on. The free centre (index 12) is
 * stored as 0 so the array stays a plain smallint[] in Postgres.
 */
export function generateCard(): number[] {
  const card: number[] = new Array(BINGO.columns * BINGO.rows).fill(0);

  for (let col = 0; col < BINGO.columns; col++) {
    const low = col * BINGO.columnSize + 1;
    const pool: number[] = [];
    for (let n = low; n < low + BINGO.columnSize; n++) pool.push(n);

    // Fisher-Yates over just the first five slots - we only need a
    // uniform sample of five from fifteen, not a full shuffle.
    for (let i = 0; i < BINGO.rows; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      card[col * BINGO.rows + i] = pool[i];
    }
  }

  card[BINGO.freeIndex] = 0;
  return card;
}

export function cellIndex(row: number, col: number): number {
  return col * BINGO.rows + row;
}

/** Marks are derived, never stored: a cell is marked iff its ball is out. */
export function marksFor(card: readonly number[], drawn: ReadonlySet<number>): boolean[] {
  return card.map((n, i) => i === BINGO.freeIndex || drawn.has(n));
}

/**
 * First completed line, or null. Rows and columns first so the reported
 * pattern matches what a player is most likely staring at.
 */
export function findWin(card: readonly number[], drawn: ReadonlySet<number>): WinPattern | null {
  const marks = marksFor(card, drawn);

  for (let row = 0; row < BINGO.rows; row++) {
    let complete = true;
    for (let col = 0; col < BINGO.columns; col++) {
      if (!marks[cellIndex(row, col)]) {
        complete = false;
        break;
      }
    }
    if (complete) return `row-${row + 1}`;
  }

  for (let col = 0; col < BINGO.columns; col++) {
    let complete = true;
    for (let row = 0; row < BINGO.rows; row++) {
      if (!marks[cellIndex(row, col)]) {
        complete = false;
        break;
      }
    }
    if (complete) return `column-${COLUMN_LETTERS[col]}`;
  }

  let down = true;
  let up = true;
  for (let i = 0; i < BINGO.rows; i++) {
    if (!marks[cellIndex(i, i)]) down = false;
    if (!marks[cellIndex(BINGO.rows - 1 - i, i)]) up = false;
  }
  if (down) return "diagonal-down";
  if (up) return "diagonal-up";

  return null;
}

/** How many cells short of the closest line - drives the "1 away!" nudge. */
export function cellsToWin(card: readonly number[], drawn: ReadonlySet<number>): number {
  const marks = marksFor(card, drawn);
  let best: number = BINGO.rows;

  const lines: number[][] = [];
  for (let row = 0; row < BINGO.rows; row++) {
    lines.push(Array.from({ length: BINGO.columns }, (_, col) => cellIndex(row, col)));
  }
  for (let col = 0; col < BINGO.columns; col++) {
    lines.push(Array.from({ length: BINGO.rows }, (_, row) => cellIndex(row, col)));
  }
  lines.push(Array.from({ length: BINGO.rows }, (_, i) => cellIndex(i, i)));
  lines.push(Array.from({ length: BINGO.rows }, (_, i) => cellIndex(BINGO.rows - 1 - i, i)));

  for (const line of lines) {
    const missing = line.filter((i) => !marks[i]).length;
    if (missing < best) best = missing;
  }

  return best;
}

/** The B-12 style label Telegram bingo callers use. */
export function ballLabel(n: number): string {
  const col = Math.floor((n - 1) / BINGO.columnSize);
  return `${COLUMN_LETTERS[col] ?? "?"}-${n}`;
}

/**
 * Card as a fixed-width grid for a <pre> block. Marked numbers sit in
 * brackets; Telegram can't style text inside <pre>, so the brackets are
 * the only marking that survives.
 */
export function renderCard(card: readonly number[], drawn: ReadonlySet<number>): string {
  const marks = marksFor(card, drawn);
  const lines = [COLUMN_LETTERS.map((l) => l.padStart(3).padEnd(5)).join("")];

  for (let row = 0; row < BINGO.rows; row++) {
    let line = "";
    for (let col = 0; col < BINGO.columns; col++) {
      const i = cellIndex(row, col);
      if (i === BINGO.freeIndex) {
        line += " ★  ".padEnd(5);
      } else {
        const n = String(card[i]);
        line += (marks[i] ? `[${n.padStart(2)}]` : ` ${n.padStart(2)} `).padEnd(5);
      }
    }
    lines.push(line.trimEnd());
  }

  return lines.join("\n");
}

/** Compact card for a callback alert, which caps out around 200 chars. */
export function renderCardCompact(card: readonly number[], drawn: ReadonlySet<number>): string {
  const marks = marksFor(card, drawn);
  const lines: string[] = [];

  for (let row = 0; row < BINGO.rows; row++) {
    const cells: string[] = [];
    for (let col = 0; col < BINGO.columns; col++) {
      const i = cellIndex(row, col);
      if (i === BINGO.freeIndex) cells.push("★");
      else cells.push(marks[i] ? `✔${card[i]}` : String(card[i]));
    }
    lines.push(cells.join(" "));
  }

  return lines.join("\n");
}

/** Last few balls, newest first - the header of the group board. */
export function renderRecentDraws(drawn: readonly number[], count = 5): string {
  if (drawn.length === 0) return "no balls yet";
  return drawn.slice(-count).reverse().map(ballLabel).join("  ");
}
