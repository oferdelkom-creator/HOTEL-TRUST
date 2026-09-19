import { NextResponse } from "next/server";
import { handleUpdate } from "@/lib/bingo/handlers";
import { claimUpdate } from "@/lib/bingo/store";
import type { TgUpdate } from "@/lib/bingo/telegram";

// Telegram posts here. The endpoint is public by URL, so the shared
// secret below is the only thing standing between the game state and
// anyone who guesses the path.
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[bingo] TELEGRAM_WEBHOOK_SECRET is not set; refusing updates");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TgUpdate;

  // Telegram redelivers anything the webhook doesn't acknowledge quickly,
  // and a replayed draw or payout would corrupt a round. First writer of
  // the update_id wins; everyone else drops it.
  if (!(await claimUpdate(update.update_id))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    await handleUpdate(update);
  } catch (error) {
    // Always 200: a non-2xx makes Telegram retry the same update in a
    // loop, and a bug in one handler shouldn't wedge the whole bot.
    console.error("[bingo] update failed", update.update_id, error);
  }

  return NextResponse.json({ ok: true });
}
