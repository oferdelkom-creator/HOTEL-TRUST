"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SwapMessage } from "@/lib/types";

const POLL_INTERVAL_MS = 4000;

export default function ChatThread({
  requestId,
  myHotelId,
  otherHotelId,
  initialMessages,
}: {
  requestId: string;
  myHotelId: string;
  otherHotelId: string;
  initialMessages: SwapMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("swap_messages")
        .select("*")
        .eq("request_id", requestId)
        .or(
          `and(sender_hotel_id.eq.${myHotelId},recipient_hotel_id.eq.${otherHotelId}),and(sender_hotel_id.eq.${otherHotelId},recipient_hotel_id.eq.${myHotelId})`
        )
        .order("created_at", { ascending: true })
        .returns<SwapMessage[]>();
      if (data) setMessages(data);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [requestId, myHotelId, otherHotelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("swap_messages").insert({
      request_id: requestId,
      sender_hotel_id: myHotelId,
      recipient_hotel_id: otherHotelId,
      body: body.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setSending(false);
      return;
    }

    const sentBody = body.trim();
    await fetch("/api/notify/new-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        senderHotelId: myHotelId,
        recipientHotelId: otherHotelId,
        body: sentBody,
      }),
    }).catch(() => {});

    const { data } = await supabase
      .from("swap_messages")
      .select("*")
      .eq("request_id", requestId)
      .or(
        `and(sender_hotel_id.eq.${myHotelId},recipient_hotel_id.eq.${otherHotelId}),and(sender_hotel_id.eq.${otherHotelId},recipient_hotel_id.eq.${myHotelId})`
      )
      .order("created_at", { ascending: true })
      .returns<SwapMessage[]>();
    if (data) setMessages(data);

    setBody("");
    setSending(false);
  }

  return (
    <div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 h-96 overflow-y-auto flex flex-col gap-2 mb-4">
        {messages.length ? (
          messages.map((m) => {
            const isMine = m.sender_hotel_id === myHotelId;
            return (
              <div key={m.id} className={`max-w-[75%] ${isMine ? "self-end" : "self-start"}`}>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-brand-green text-white" : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-neutral-400 text-sm m-auto">Say hello to start the conversation.</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-brand-green text-brand-gold px-4 py-2 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
