"use client";

import { useState } from "react";

export default function PayButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok || !data.confirmationUrl) {
        throw new Error(data.error ?? "Не удалось начать оплату");
      }
      window.location.href = data.confirmationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-md bg-brand text-white px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {loading ? "Переходим к оплате..." : "Оплатить через ЮKassa"}
      </button>
    </div>
  );
}
