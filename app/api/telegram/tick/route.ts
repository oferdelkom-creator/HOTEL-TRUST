import { NextResponse } from "next/server";
import { BINGO } from "@/lib/bingo/config";
import { advanceRound } from "@/lib/bingo/handlers";
import { cancelRound, dueForDraw, runningGroupRounds, staleLobbies } from "@/lib/bingo/store";
import { sendMessage } from "@/lib/bingo/telegram";

// Nothing in a serverless deployment ticks on its own, so an external
// scheduler hits this endpoint (Vercel Cron, GitHub Actions, any uptime
// pinger). Safe to call as often as you like - roundsDueForDraw() only
// returns rounds whose interval has elapsed, and bingo_draw_number()
// locks the row so two overlapping callers can't both append a ball.
//
// The catch: the cheapest schedulers only fire once a minute, and a
// round that calls one ball a minute takes half an hour. So a single
// invocation stays alive and keeps sweeping until its time budget runs
// out, which turns a 1/minute ping into near-continuous draws at the
// round's own interval. A long-running worker can call this too - or
// skip it entirely and let the host drive with the Draw button.
const RUNTIME_BUDGET_MS = 50_000;
const SWEEP_INTERVAL_MS = 2_000;

export const maxDuration = 60;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + RUNTIME_BUDGET_MS;
  let advanced = 0;

  while (Date.now() < deadline) {
    const live = await runningGroupRounds();

    // No live round: return now instead of burning the rest of the
    // budget asleep. The next ping picks up whatever starts meanwhile.
    if (live.length === 0) break;

    for (const round of dueForDraw(live)) {
      try {
        await advanceRound(round);
        advanced++;
      } catch (error) {
        console.error("[bingo] tick failed for round", round.id, error);
      }
    }

    await sleep(SWEEP_INTERVAL_MS);
  }

  // A lobby nobody started holds the chat's only round slot, so it gets
  // swept rather than left to block /newround forever.
  const stale = await staleLobbies(BINGO.group.lobbyTimeoutMinutes);
  for (const round of stale) {
    await cancelRound(round.id);
    await sendMessage(round.chat_id, "⌛ Nobody started the round — lobby closed. /newround to try again.");
  }

  return NextResponse.json({ ok: true, advanced, expired: stale.length });
}
