// Thin Bot API client. Only the methods this bot actually calls are
// typed - a full Bot API surface would be dead weight to maintain.

const API_BASE = "https://api.telegram.org";

export interface TgUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TgChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
}

export interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  text?: string;
  successful_payment?: {
    currency: string;
    total_amount: number;
    invoice_payload: string;
    telegram_payment_charge_id: string;
  };
}

export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  data?: string;
  message?: TgMessage;
}

export interface TgPreCheckoutQuery {
  id: string;
  from: TgUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
  pre_checkout_query?: TgPreCheckoutQuery;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  pay?: boolean;
}

export interface TgGift {
  id: string;
  star_count: number;
  sticker?: { emoji?: string };
  total_count?: number;
  remaining_count?: number;
}

export class TelegramError extends Error {
  constructor(
    readonly method: string,
    readonly errorCode: number | undefined,
    readonly description: string
  ) {
    super(`${method} failed: ${description}`);
    this.name = "TelegramError";
  }
}

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

export async function callTelegram<T>(method: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${API_BASE}/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as
    | { ok: true; result: T }
    | { ok: false; error_code?: number; description?: string };

  if (!body.ok) {
    throw new TelegramError(method, body.error_code, body.description ?? "unknown error");
  }

  return body.result;
}

/**
 * Chat-facing calls are best-effort: a blocked bot, a deleted message or
 * a user who never opened a private chat must not abort a round that the
 * rest of the players are still in. Failures are logged, not thrown.
 */
async function tryCall<T>(method: string, payload: Record<string, unknown>): Promise<T | null> {
  try {
    return await callTelegram<T>(method, payload);
  } catch (error) {
    console.error(`[bingo] ${method}`, error instanceof Error ? error.message : error);
    return null;
  }
}

export function sendMessage(
  chatId: number,
  text: string,
  options: { keyboard?: InlineKeyboardButton[][]; replyTo?: number } = {}
): Promise<TgMessage | null> {
  return tryCall<TgMessage>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(options.replyTo ? { reply_parameters: { message_id: options.replyTo, allow_sending_without_reply: true } } : {}),
    ...(options.keyboard ? { reply_markup: { inline_keyboard: options.keyboard } } : {}),
  });
}

export function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboardButton[][]
): Promise<unknown> {
  return tryCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

/**
 * Every callback query must be answered or the client spins its loading
 * state for a minute. `alert` is how a group player reads their own card
 * without the bot needing permission to DM them.
 */
export function answerCallback(
  callbackQueryId: string,
  text?: string,
  alert = false
): Promise<unknown> {
  return tryCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: alert } : {}),
  });
}

export function answerPreCheckout(
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string
): Promise<unknown> {
  return tryCall("answerPreCheckoutQuery", {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
    ...(errorMessage ? { error_message: errorMessage } : {}),
  });
}

export function getAvailableGifts(): Promise<{ gifts: TgGift[] } | null> {
  return tryCall<{ gifts: TgGift[] }>("getAvailableGifts", {});
}

/**
 * Pays out a prize. The Bot API has no "credit this user N Stars" call -
 * the bot buys a gift from its OWN star balance and sends it, so this
 * fails with an explicit error when the bot's balance is short. The
 * caller refunds the player's ledger in that case.
 */
export function sendGift(userId: number, giftId: string, text?: string): Promise<unknown> {
  return callTelegram("sendGift", {
    user_id: userId,
    gift_id: giftId,
    ...(text ? { text } : {}),
  });
}

export function sendStarInvoice(
  chatId: number,
  title: string,
  description: string,
  payload: string,
  stars: number
): Promise<TgMessage | null> {
  return tryCall<TgMessage>("sendInvoice", {
    chat_id: chatId,
    title,
    description,
    payload,
    currency: "XTR",
    prices: [{ label: title, amount: stars }],
  });
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
