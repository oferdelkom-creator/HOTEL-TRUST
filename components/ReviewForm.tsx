"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReviewForm({
  bookingId,
  authorRole,
  prompt,
}: {
  bookingId: string;
  authorRole: "guest" | "host";
  prompt: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { error: insertError } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      author_id: user.id,
      author_name: profile?.full_name ?? "",
      author_role: authorRole,
      rating,
      comment,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">{prompt}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} звёзд`}
            className={`text-2xl leading-none ${n <= rating ? "text-brand" : "text-neutral-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Комментарий (необязательно)"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Отправляем..." : "Отправить отзыв"}
      </button>
    </form>
  );
}
