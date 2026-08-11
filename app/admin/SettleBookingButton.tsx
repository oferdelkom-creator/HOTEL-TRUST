"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettleBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSettle() {
    setLoading(true);
    const supabase = createClient();
    // Credits the host hotel and decides hold_status (released vs captured)
    // based on the requesting hotel's balance at checkout time.
    await supabase.rpc("settle_booking", { p_booking_id: bookingId, p_credit_host: true });
    await fetch("/api/notify/booking-settled", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    }).catch(() => {});
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleSettle}
      disabled={loading}
      className="text-sm rounded-md bg-brand-green text-brand-gold px-4 py-1.5 disabled:opacity-50"
    >
      {loading ? "Settling..." : "Settle checkout"}
    </button>
  );
}
